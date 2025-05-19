package com.evenza.backend.Exceptions;

public class InvalidFirebaseTokenException  extends RuntimeException{
    public InvalidFirebaseTokenException(String message, Throwable cause) {
        super(message, cause);
    }

    public InvalidFirebaseTokenException(String message) {
        super(message);
    }
}
