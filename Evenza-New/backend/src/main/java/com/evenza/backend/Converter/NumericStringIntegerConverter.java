package com.evenza.backend.Converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class NumericStringIntegerConverter implements AttributeConverter<String, Integer> {

    @Override
    public Integer convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isBlank()) {
            return null;
        }
        try {
            return Integer.valueOf(attribute);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Booking userId must be numeric", exception);
        }
    }

    @Override
    public String convertToEntityAttribute(Integer dbData) {
        return dbData == null ? null : dbData.toString();
    }
}
