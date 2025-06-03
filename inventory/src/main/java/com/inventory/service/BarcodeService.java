package com.inventory.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.oned.Code128Writer;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class BarcodeService {

    public byte[] generateBarcodeImage(String barcodeText) throws WriterException, IOException {
        Code128Writer barcodeWriter = new Code128Writer();
        BitMatrix bitMatrix = barcodeWriter.encode(barcodeText, BarcodeFormat.CODE_128, 300, 100);
        
        BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(bufferedImage, "PNG", outputStream);
        
        return outputStream.toByteArray();
    }

    public String generateUniqueBarcode() {
        // Generate a unique barcode using timestamp and random component
        long timestamp = System.currentTimeMillis();
        int random = (int) (Math.random() * 1000);
        return String.format("%d%03d", timestamp, random);
    }
} 