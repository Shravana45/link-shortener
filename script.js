function shortenUrl() {
    const longUrl = document.getElementById('longUrl').value;
    
    if (longUrl) {
        // Simulate URL shortening (in real-world, you would use an API)
        const shortenedUrl = `https://short.ly/${Math.random().toString(36).substring(7)}`;
        document.getElementById('shortenedUrl').textContent = shortenedUrl;

        // Generate QR code
        generateQrCode(shortenedUrl);
    }
}

function generateQrCode(url) {
    const qrCodeCanvas = document.getElementById('qrCode');
    const qrCodeSize = 150;
    
    qrCodeCanvas.width = qrCodeSize;
    qrCodeCanvas.height = qrCodeSize;
    const context = qrCodeCanvas.getContext('2d');

    // Clear previous QR code
    context.clearRect(0, 0, qrCodeSize, qrCodeSize);

    // Generate QR code
    const qr = new QRCode({
        content: url,
        padding: 4,
        width: qrCodeSize,
        height: qrCodeSize,
        color: "#000000",
        background: "#ffffff",
        ecl: "M",
    });

    qr.renderTo2dContext(context);

    // Create a downloadable image link
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.href = qrCodeCanvas.toDataURL('image/png');
}

