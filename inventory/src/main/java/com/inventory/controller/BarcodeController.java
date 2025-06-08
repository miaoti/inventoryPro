package com.inventory.controller;

import com.inventory.service.BarcodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public/barcode-image")
public class BarcodeController {

    @Autowired
    private BarcodeService barcodeService;

    @GetMapping("/{barcodeText}")
    public ResponseEntity<byte[]> getBarcodeImage(@PathVariable String barcodeText) {
        try {
            byte[] imageBytes = barcodeService.generateBarcodeImage(barcodeText);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentLength(imageBytes.length);
            
            return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 