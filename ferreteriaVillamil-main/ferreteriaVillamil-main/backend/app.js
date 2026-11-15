var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var articuloRouter = require("./routes/articulo");
var usuarioRouter = require("./routes/usuario");
var pedidoRouter = require("./routes/pedido");
var calificacionRouter = require("./routes/calificacion");
var trackingRouter = require("./routes/tracking");
var estadisticasRouter = require("./routes/estadisticas");
var usuarioController = require("./controllers/usuario");
var detallesRouter = require('./routes/detalles');
var ventaRouter = require("./routes/venta");
var cotizacionRouter = require("./routes/cotizacion");
var sucursalRouter = require("./routes/sucursal");
const { authenticate, admin } = require("./middleware/auth");
require("./utils/tokens").secret();
const { limitAttempts } = require('./middleware/limit-attempts');
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "..", "views"));
app.set("view engine", "jade");

if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('Referrer-Policy', 'no-referrer');
  next();
});
app.use(logger("dev", {
  skip: req => (req.path.startsWith('/cliente/tracking') || req.path.startsWith('/api/public/tracking')) || req.path.endsWith('/validar-codigo')
}));
// Obtener URLs permitidas desde variables de entorno
const getOrigins = () => {
  const origins = [process.env.FRONTEND_URL].filter(Boolean);
  if (process.env.NODE_ENV !== 'production') {
    origins.push('https://localhost:5173', 'http://localhost:5173', 'http://localhost:3000');
  }

  return origins;
};

app.use(cors({
  origin: getOrigins(),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Servir archivos estáticos ANTES de las rutas API
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));

app.use("/api/articulos", authenticate, admin, articuloRouter);
app.use("/api/usuarios", authenticate, admin, usuarioRouter);
app.use("/api/pedidos", authenticate, pedidoRouter);
app.use("/api/calificaciones", authenticate, admin, calificacionRouter);
app.use("/api/estadisticas", authenticate, admin, estadisticasRouter);
app.use("/api/detalles", authenticate, admin, detallesRouter);
app.use("/api/ventas", authenticate, admin, ventaRouter);
app.use("/api/cotizaciones", authenticate, admin, cotizacionRouter);
app.use("/api/sucursales", authenticate, admin, sucursalRouter);

// Ruta pública para tracking de pedidos (sin autenticación)
app.use("/cliente/tracking", trackingRouter);
app.use("/api/public/tracking", trackingRouter);

app.get('/healthz', (req, res) => res.sendStatus(200));

// Login endpoint (no necesita autenticación)
app.post("/api/login", limitAttempts(20, req => req.ip), usuarioController.loginUsuario);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  // If request expects JSON (API), return JSON; otherwise render view for browser.
  if (req.accepts("json") || req.path.startsWith("/api")) {
    return res.json({
      error: {
        message: req.app.get("env") === "production" && (err.status || 500) >= 500 ? "Error interno" : err.message,
        status: err.status || 500,
        ...(req.app.get("env") === "development" && { stack: err.stack }),
      },
    });
  }

  res.render("error");
});

module.exports = app;
