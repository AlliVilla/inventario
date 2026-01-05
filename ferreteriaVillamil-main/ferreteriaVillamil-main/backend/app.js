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
var authMiddleware = require("./middleware/auth");
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "..", "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
// Obtener URLs permitidas desde variables de entorno
const getOrigins = () => {
  const origins = [
    'https://localhost:5173', 
    'http://localhost:5173', 
    'http://localhost:3000'
  ];
  
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  origins.push(/^https?:\/\/(?:localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):[0-9]+$/);
  
  // Agregar cualquier dominio de Cloudflare Tunnel
  origins.push(/^https:\/\/.*\.trycloudflare\.com$/);
  
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

app.use("/api/articulos", authMiddleware, articuloRouter);
app.use("/api/usuarios", authMiddleware, usuarioRouter);
app.use("/api/pedidos", authMiddleware, pedidoRouter);
app.use("/api/calificaciones", authMiddleware, calificacionRouter);
app.use("/api/estadisticas", authMiddleware, estadisticasRouter);
app.use("/api/detalles", authMiddleware, detallesRouter);

// Ruta pública para tracking de pedidos (sin autenticación)
app.use("/cliente/tracking", trackingRouter);

// Login endpoint (no necesita autenticación)
app.post("/api/login", usuarioController.loginUsuario);

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
        message: err.message,
        status: err.status || 500,
        ...(req.app.get("env") === "development" && { stack: err.stack }),
      },
    });
  }

  res.render("error");
});

module.exports = app;
