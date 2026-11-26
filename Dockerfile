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

# Render's free tier gives about 0.1 CPU, so JVM startup dominates the wake-up.
# Unpack the jar, then do a training run that stops once the context is built
# and saves the loaded classes to a CDS archive. It uses the default (H2)
# profile because there is no database at build time.
COPY --from=backend /app/target/*.jar /tmp/app.jar
RUN java -Djarmode=tools -jar /tmp/app.jar extract --destination /app --force \
    && rm /tmp/app.jar \
    && java -XX:+UseSerialGC -XX:ArchiveClassesAtExit=app.jsa -Dspring.context.exit=onRefresh -jar app.jar \
    && test -s app.jsa
USER ironlog
EXPOSE 8080
# SerialGC and C1-only compilation trade peak throughput for startup speed.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -XX:SharedArchiveFile=app.jsa"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
