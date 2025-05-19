import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import ProfileService from '../services/ProfileService';
import { toast } from 'react-toastify';

interface ProfileFormProps {
  onUpdate?: () => void;
}

// Add Cloudinary types
declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: {
          cloudName: string;
          uploadPreset: string;
          sources: string[];
          multiple: boolean;
          cropping: boolean;
          resourceType: string;
          maxFileSize: number;
          styles: {
            palette: {
              window: string;
              windowBorder: string;
              tabIcon: string;
              menuIcons: string;
              textDark: string;
              textLight: string;
              link: string;
              action: string;
              inactiveTabIcon: string;
              error: string;
              inProgress: string;
              complete: string;
              sourceBg: string;
            };
            fonts: {
              default: null;
              [key: string]: {
                url: string;
                active: boolean;
              } | null;
            };
          };
          eager: Array<{
            width: number;
            crop: string;
          }>;
          auto_tagging: boolean;
          folder: string;
        },
        callback: (error: Error | null, result: {
          event: string;
          info?: {
            secure_url: string;
          };
        }) => void
      ) => {
        open: () => void;
      };
    };
  }
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onUpdate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    imageUrl: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Load Cloudinary script when component mounts
  useEffect(() => {
    if (!document.getElementById('cloudinary-upload-widget')) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.id = 'cloudinary-upload-widget';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        const scriptElement = document.getElementById('cloudinary-upload-widget');
        if (scriptElement) {
          scriptElement.remove();
        }
      };
    }
  }, []);

  const loadProfile = async () => {
    try {
      const response = await ProfileService.getProfile(user!.id);
      if (response.success && response.user) {
        const { name, email, phone, address, avatar } = response.user;
        setFormData(prev => ({
          ...prev,
          name: name || '',
          email: email || '',
          phone: phone || '',
          address: address || '',
          imageUrl: avatar || ''
        }));
        if (avatar) {
          setImagePreview(avatar);
        }
      }
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const openCloudinaryWidget = () => {
    setImageUploading(true);
    
    const widget = window.cloudinary?.createUploadWidget(
      {
        cloudName: 'dgc5k4be5',
        uploadPreset: 'ml_default',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        cropping: true,
        resourceType: 'image',
        maxFileSize: 5000000, // 5MB limit
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#90A0B3",
            tabIcon: "#0E2F5A",
            menuIcons: "#5A616A",
            textDark: "#000000",
            textLight: "#FFFFFF",
            link: "#0078FF",
            action: "#5265ff",
            inactiveTabIcon: "#0E2F5A",
            error: "#F44235",
            inProgress: "#0078FF",
            complete: "#20B832",
            sourceBg: "#E4EBF1"
          },
          fonts: {
            default: null,
            "'Poppins', sans-serif": {
              url: "https://fonts.googleapis.com/css?family=Poppins",
              active: true
            }
          }
        },
        eager: [
          { width: 800, crop: "scale" },
          { width: 400, crop: "scale" }
        ],
        auto_tagging: true,
        folder: "evenza_profiles"
      },
      (error: Error | null, result: {
        event: string;
        info?: {
          secure_url: string;
        };
      }) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          toast.error('Failed to upload image. Please try again.');
          setImageUploading(false);
          return;
        }
        if (result && result.event === 'success' && result.info) {
          const secureUrl = result.info.secure_url;
          
          setFormData(prev => ({
            ...prev,
            imageUrl: secureUrl
          }));
          
          setImagePreview(secureUrl);
          setImageUploading(false);
        } else if (result && result.event === 'close') {
          setImageUploading(false);
        }
      }
    );

    if (widget) {
      widget.open();
    } else {
      console.error('Cloudinary widget not available');
      setImageUploading(false);
      toast.error('Image upload feature not available. Please refresh or try again later.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await ProfileService.updateProfile({
        userId: user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        imageUrl: formData.imageUrl
      });

      if (response.success) {
        toast.success('Profile updated successfully');
        if (onUpdate) {
          onUpdate();
        }
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="space-y-4">
        {/* Profile Image Upload */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No image</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={openCloudinaryWidget}
            disabled={imageUploading}
            className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition disabled:bg-gray-400"
          >
            {imageUploading ? 'Uploading...' : 'Change Photo'}
          </button>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter your email"
            disabled
          />
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter your phone number"
          />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter your address"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded-md text-white ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } transition`}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm; 