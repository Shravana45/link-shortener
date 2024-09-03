// QRCode.js - Simple QR Code Generator

class QRCode {
    constructor({ content, padding = 4, width = 128, height = 128, color = "#000", background = "#fff", ecl = "M" }) {
        this.content = content;
        this.padding = padding;
        this.width = width;
        this.height = height;
        this.color = color;
        this.background = background;
        this.ecl = ecl;
    }

    renderTo2dContext(context) {
        const qrCode = this._generateQRCode();
        const tileW = this.width / qrCode.size;
        const tileH = this.height / qrCode.size;

        context.fillStyle = this.background;
        context.fillRect(0, 0, this.width, this.height);

        for (let r = 0; r < qrCode.size; r++) {
            for (let c = 0; c < qrCode.size; c++) {
                context.fillStyle = qrCode.data[r * qrCode.size + c] ? this.color : this.background;
                context.fillRect(c * tileW, r * tileH, tileW, tileH);
            }
        }
    }

    _generateQRCode() {
        const qr = qrcode(0, this.ecl);
        qr.addData(this.content);
        qr.make();
        return { size: qr.getModuleCount(), data: qr.modules };
    }
}

// Simple QR Code generation logic using QRCode library
function qrcode(typeNumber, errorCorrectionLevel) {
    const qr = new QRCodeGenerator(typeNumber, errorCorrectionLevel);
    return qr;
}

class QRCodeGenerator {
    constructor(typeNumber, errorCorrectionLevel) {
        this.typeNumber = typeNumber;
        this.errorCorrectionLevel = errorCorrectionLevel;
        this.modules = null;
        this.moduleCount = 0;
        this.dataCache = null;
        this.dataList = [];
    }

    addData(data) {
        this.dataList.push(new QRCodeData(data));
        this.dataCache = null;
    }

    make() {
        this._makeImpl(false, this._getBestMaskPattern());
    }

    _makeImpl(test, maskPattern) {
        this.moduleCount = this.typeNumber * 4 + 17;
        this.modules = new Array(this.moduleCount);
        for (let row = 0; row < this.moduleCount; row++) {
            this.modules[row] = new Array(this.moduleCount);
            for (let col = 0; col < this.moduleCount; col++) {
                this.modules[row][col] = null;
            }
        }
        this._setupPositionProbePattern(0, 0);
        this._setupPositionProbePattern(this.moduleCount - 7, 0);
        this._setupPositionProbePattern(0, this.moduleCount - 7);
        this._setupPositionAdjustPattern();
        this._setupTimingPattern();
        this._setupTypeInfo(test, maskPattern);
        this._mapData(this._createData(), maskPattern);
    }

    _setupPositionProbePattern(row, col) {
        for (let r = -1; r <= 7; r++) {
            if (row + r <= -1 || this.moduleCount <= row + r) continue;
            for (let c = -1; c <= 7; c++) {
                if (col + c <= -1 || this.moduleCount <= col + c) continue;
                this.modules[row + r][col + c] = (
                    (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
                    (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
                    (2 <= r && r <= 4 && 2 <= c && c <= 4)
                );
            }
        }
    }

    _getBestMaskPattern() {
        return 0;
    }

    _createData() {
        const buffer = new QRBitBuffer();
        for (let i = 0; i < this.dataList.length; i++) {
            const data = this.dataList[i];
            buffer.put(data.mode, 4);
            buffer.put(data.getLength(), this._getLengthInBits());
            data.write(buffer);
        }
        return this._createBytes(buffer);
    }

    _createBytes(buffer) {
        const offset = 0;
        const maxLength = this.moduleCount * this.moduleCount;
        const bytes = new Array(maxLength);
        for (let i = 0; i < maxLength; i++) {
            bytes[i] = 0;
        }
        return bytes;
    }

    _mapData(data, maskPattern) {
        let inc = -1;
        let row = this.moduleCount - 1;
        let bitIndex = 7;
        let byteIndex = 0;
        for (let col = this.moduleCount - 1; col > 0; col -= 2) {
            if (col === 6) col--;
            while (true) {
                for (let c = 0; c < 2; c++) {
                    if (this.modules[row][col - c] === null) {
                        let dark = false;
                        if (byteIndex < data.length) {
                            dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
                        }
                        const mask = ((row + col) % 2) === 0;
                        this.modules[row][col - c] = dark !== mask;
                        bitIndex--;
                        if (bitIndex === -1) {
                            byteIndex++;
                            bitIndex = 7;
                        }
                    }
                }
                row += inc;
                if (row < 0 || this.moduleCount <= row) {
                    row -= inc;
                    inc = -inc;
                    break;
                }
            }
        }
    }

    getModuleCount() {
        return this.moduleCount;
    }
}

class QRCodeData {
    constructor(data) {
        this.mode = 4;
        this.data = data;
    }

    getLength() {
        return this.data.length;
    }

    write(buffer) {
        for (let i = 0; i < this.data.length; i++) {
            buffer.put(this.data.charCodeAt(i), 8);
        }
    }
}

class QRBitBuffer {
    constructor() {
        this.buffer = [];
        this.length = 0;
    }

    put(num, length) {
        for (let i = 0; i < length; i++) {
            this.putBit(((num >>> (length - i - 1)) & 1) === 1);
        }
    }

    putBit(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
            this.buffer.push(0);
        }
        if (bit) {
            this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
        }
        this.length++;
    }
}
