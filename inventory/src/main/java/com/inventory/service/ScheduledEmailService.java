package com.inventory.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ScheduledEmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(ScheduledEmailService.class);
    
    @Autowired
    private AlertService alertService;
    
    /**
     * Send daily summary email at 9:00 AM every day
     * Cron expression: second minute hour day month day-of-week
     */
    @Scheduled(cron = "0 0 9 * * *", zone = "America/Los_Angeles")
    public void sendDailySummary() {
        logger.info("Starting daily inventory alert summary email...");
        try {
            alertService.sendDailySummary();
            logger.info("Daily inventory alert summary email sent successfully");
        } catch (Exception e) {
            logger.error("Failed to send daily inventory alert summary email", e);
        }
    }
    
    /**
     * Send weekly summary email every Monday at 9:00 AM
     */
    @Scheduled(cron = "0 0 9 * * MON", zone = "America/Los_Angeles")
    public void sendWeeklySummary() {
        logger.info("Starting weekly inventory alert summary email...");
        try {
            alertService.sendDailySummary(); // Using same method for now
            logger.info("Weekly inventory alert summary email sent successfully");
        } catch (Exception e) {
            logger.error("Failed to send weekly inventory alert summary email", e);
        }
    }
} 