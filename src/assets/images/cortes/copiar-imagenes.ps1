# Script para copiar imágenes de tipos de corte
# Desde: Papus BarberShop/resources/img/
# Hacia: Pagina BarberShop/Frontend/src/assets/images/cortes/

$origen = "..\..\..\..\..\..\Papus BarberShop\resources\img"
$destino = "."

Write-Host "Copiando imágenes de tipos de corte..." -ForegroundColor Cyan

# Verificar si existe el directorio origen
if (Test-Path $origen) {
    # Lista de imágenes a copiar
    $imagenes = @(
        "Corte de Caballero.png",
        "Corte para niño.png",
        "Arreglo de Barba.png",
        "Corte y Barba.png"
    )
    
    foreach ($imagen in $imagenes) {
        $rutaOrigen = Join-Path $origen $imagen
        $rutaDestino = Join-Path $destino $imagen
        
        if (Test-Path $rutaOrigen) {
            Copy-Item -Path $rutaOrigen -Destination $rutaDestino -Force
            Write-Host "✓ Copiada: $imagen" -ForegroundColor Green
        } else {
            Write-Host "✗ No encontrada: $imagen" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n¡Proceso completado!" -ForegroundColor Green
} else {
    Write-Host "Error: No se encontró el directorio origen: $origen" -ForegroundColor Red
    Write-Host "Por favor, copia manualmente las imágenes desde:" -ForegroundColor Yellow
    Write-Host "  Papus BarberShop/resources/img/" -ForegroundColor Yellow
    Write-Host "Hacia:" -ForegroundColor Yellow
    Write-Host "  Pagina BarberShop/Frontend/src/assets/images/cortes/" -ForegroundColor Yellow
}

