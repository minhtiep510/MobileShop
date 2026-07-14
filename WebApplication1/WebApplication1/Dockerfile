# Use the official .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["WebApplication1.csproj", "./"]
RUN dotnet restore "./WebApplication1.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "WebApplication1.csproj" -c Release -o /app/publish

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

COPY --from=build /app/publish .

# Run the application
ENTRYPOINT ["dotnet", "WebApplication1.dll"]
