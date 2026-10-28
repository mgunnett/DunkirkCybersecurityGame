# Dunkirk Cybersecurity Game: a static web page, served by nginx.
#
# There's nothing to build or install. The game is plain HTML, CSS and
# JavaScript, so the image is just a small web server with the game's
# files copied in.
#
#   docker build -t dunkirk-game .
#   docker run --rm -p 8080:8080 dunkirk-game
#   then open http://localhost:8080
#
# Hosts that set their own port (Cloud Run, Render, Fly.io, Railway...)
# pass it in as PORT; nginx listens on whatever it is.

FROM nginx:1.27-alpine

# Port nginx listens on inside the container. Hosts may override it.
ENV PORT=8080

# Server settings. The official nginx image fills in ${PORT} from the
# environment when the container starts.
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template

# The game itself: the page, and only the folders the browser needs;
# .dockerignore keeps out git history, logs, tests and documents.
COPY ["index.html",              "/usr/share/nginx/html/index.html"]
COPY ["Ship Functionality Demo", "/usr/share/nginx/html/Ship Functionality Demo"]
COPY ["Rulebook Demo",           "/usr/share/nginx/html/Rulebook Demo"]
COPY ["Telex Machine Demo",      "/usr/share/nginx/html/Telex Machine Demo"]
COPY ["Script",                  "/usr/share/nginx/html/Script"]
COPY ["WEFT Images",             "/usr/share/nginx/html/WEFT Images"]

EXPOSE 8080
