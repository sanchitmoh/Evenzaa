    package com.evenza.backend.Converter;

    import com.evenza.backend.model.User;
    import jakarta.persistence.AttributeConverter;
    import jakarta.persistence.Converter;

    @Converter(autoApply = true)
    public class RoleConverter implements AttributeConverter<User.Role, String> {

        @Override
        public String convertToDatabaseColumn(User.Role role) {
            return role == null ? null : role.name().toLowerCase();
        }

        @Override
        public User.Role convertToEntityAttribute(String dbData) {
            return dbData == null ? null : User.Role.valueOf(dbData.toUpperCase());
        }
    }

