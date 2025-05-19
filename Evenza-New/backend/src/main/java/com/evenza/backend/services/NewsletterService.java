package com.evenza.backend.services;

import com.evenza.backend.model.NewsletterSubscriber;
import com.evenza.backend.repository.NewsletterSubscriberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NewsletterService {

    @Autowired
    private NewsletterSubscriberRepository subscriberRepository;
    
    @Autowired
    private EmailService emailService;
    
    /**
     * Subscribe a user to the newsletter and send confirmation email
     * @param email The email to subscribe
     * @return true if subscription was successful, false if email already subscribed
     */
    public boolean subscribe(String email) {
        // Check if email already exists
        if (subscriberRepository.existsByEmail(email)) {
            return false;
        }
        
        // Create new subscriber
        NewsletterSubscriber subscriber = new NewsletterSubscriber(email);
        subscriberRepository.save(subscriber);
        
        // Send confirmation email
        String subject = "Welcome to Evenza Newsletter!";
        String message = "Hello,\n\n"
                       + "Thank you for subscribing to the Evenza newsletter! You will now receive updates about "
                       + "upcoming events, exclusive offers, and more.\n\n"
                       + "If you did not subscribe to our newsletter, please ignore this email.\n\n"
                       + "Best regards,\n"
                       + "The Evenza Team";
                       
        emailService.sendEmail(email, subject, message);
        
        return true;
    }
    
    /**
     * Unsubscribe a user from the newsletter
     * @param email The email to unsubscribe
     * @return true if unsubscription was successful, false if email not found
     */
    public boolean unsubscribe(String email) {
        NewsletterSubscriber subscriber = subscriberRepository.findByEmail(email).orElse(null);
        if (subscriber == null) {
            return false;
        }
        
        subscriber.setActive(false);
        subscriberRepository.save(subscriber);
        
        // Send confirmation email
        String subject = "Unsubscribed from Evenza Newsletter";
        String message = "Hello,\n\n"
                       + "You have been successfully unsubscribed from the Evenza newsletter. "
                       + "You will no longer receive emails from us.\n\n"
                       + "We're sorry to see you go. If you'd like to resubscribe in the future, "
                       + "please visit our website.\n\n"
                       + "Best regards,\n"
                       + "The Evenza Team";
                       
        emailService.sendEmail(email, subject, message);
        
        return true;
    }
} 