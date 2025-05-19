# Cloudinary Setup Guide for Evenza

This guide explains how to configure Cloudinary for image uploads in the Evenza application.

## Your Cloudinary Configuration

Your Cloudinary configuration has been set up with:
- **Cloud Name**: `dgc5k4be5`
- **Upload Preset**: `evenza`

## IMPORTANT: Security Notice

The API key and secret should NEVER be included in frontend code. You're correctly using an unsigned upload preset instead, which is the recommended approach for client-side uploads.

For your reference, your API credentials are:
- **API Key**: 373139686832651
- **API Secret**: ******** (keep this secret and only use in server-side code)

## Backend Integration (Optional)

If you want to use the API key and secret for server-side operations, add this environment variable to your Spring Boot application:

```
CLOUDINARY_URL=cloudinary://373139686832651:78qK5mk_8KGK0Ek6zQNr6fOAMzw@dgc5k4be5
```

You can add this to your `application.properties` file or set it as an environment variable.

## Using Cloudinary URLs

When an image is uploaded, you'll get a URL like:
```
https://res.cloudinary.com/dgc5k4be5/image/upload/v1234567890/sample.jpg
```

You can add transformations to this URL:

- Resize to 300x200: `.../image/upload/c_fill,h_200,w_300/v1234567890/sample.jpg`
- Crop and zoom: `.../image/upload/c_fill,g_face,h_400,w_400,z_0.75/v1234567890/sample.jpg`
- Add effects: `.../image/upload/e_sepia/v1234567890/sample.jpg`

## Troubleshooting

- **Upload fails**: Check if the 'evenza' preset is properly configured and set to "Unsigned"
- **CORS issues**: In your Cloudinary dashboard, go to Settings > Upload and add your application domain to the allowed CORS origins (e.g., http://localhost:5173)
- **Image not displaying**: Make sure the URL is properly formatted and the image exists in your Cloudinary account

For more advanced configurations, visit the [Cloudinary documentation](https://cloudinary.com/documentation). 