FROM node:20-alpine AS development
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM node:20-alpine AS build


WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npx react-router typegen
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY --from=build /app/build /app/build
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=build /app/node_modules/@prisma /app/node_modules/@prisma

EXPOSE 3000

CMD ["npm", "run", "start"]