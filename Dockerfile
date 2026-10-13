# --- Stage 1: build the React SPA ---------------------------------------------
# The Vite 8 / rolldown toolchain silently drops its native binding on older
# 22.x, which breaks the production build, so require Node >= 22.23 (enforced
# below rather than trusted to the tag).
FROM node:22-alpine AS frontend
RUN node -e "const [maj,min]=process.versions.node.split('.').map(Number); if(maj<22||(maj===22&&min<23)){console.error('Node '+process.versions.node+' is too old; need >=22.23');process.exit(1)}"
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: build the Spring Boot jar, bundling the SPA ---------------------
FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app
COPY backend/pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY backend/ ./
COPY --from=frontend /app/frontend/dist/ ./src/main/resources/static/
RUN mvn -B -q -DskipTests package

# --- Stage 3: minimal runtime -------------------------------------------------
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
RUN useradd -r -u 1001 ironlog
COPY --from=backend /app/target/*.jar app.jar
USER ironlog
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
