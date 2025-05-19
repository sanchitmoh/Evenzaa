import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Define interfaces for the payment data
interface PaymentActivity {
  id?: string | number;
  userId?: string;
  amount?: number;
  status?: string;
  orderId?: string;
  createdAt?: string;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  entityType?: string;
  entityId?: string;
}

interface RecentActivityCardProps {
  activities?: PaymentActivity[];
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ activities = [] }) => {
  // Use mock data if no real data is provided
  const displayActivities = activities.length > 0 
    ? activities 
    : mockActivities;

  // Function to format amount to currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Function to get user initials from name or email
  const getUserInitials = (activity: PaymentActivity): string => {
    if (activity.user?.name) {
      const nameParts = activity.user.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    
    if (activity.user?.email) {
      return activity.user.email[0].toUpperCase();
    }
    
    return 'U';
  };

  // Function to get relative time
  const getRelativeTime = (dateString?: string): string => {
    if (!dateString) return 'Unknown time';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay < 7) return `${diffDay} days ago`;
    
    return date.toLocaleDateString();
  };

  // Function to determine activity action based on data
  const getActivityAction = (activity: PaymentActivity): string => {
    if (activity.status === 'SUCCESS' || activity.status === 'COMPLETED') {
      return 'purchased';
    }
    if (activity.status === 'FAILED' || activity.status === 'REJECTED') {
      return 'failed to purchase';
    }
    if (activity.status === 'REFUNDED') {
      return 'refunded';
    }
    if (activity.status === 'PENDING') {
      return 'attempted to purchase';
    }
    
    return 'interacted with';
  };

  // Function to get appropriate badge variant based on status
  const getBadgeVariant = (status?: string): "default" | "secondary" | "destructive" => {
    if (!status) return 'secondary';
    
    switch (status.toUpperCase()) {
      case 'SUCCESS':
      case 'COMPLETED':
        return 'default';
      case 'FAILED':
      case 'REJECTED':
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      {displayActivities.map((activity, index) => (
        <div key={activity.id || index} className="flex items-center gap-4 p-2 rounded-md hover:bg-zinc-800/50">
          <Avatar>
            <AvatarImage src={activity.user?.avatar || ''} alt={activity.user?.name || 'User'} />
            <AvatarFallback>{getUserInitials(activity)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{activity.user?.name || activity.userId || 'Anonymous User'}</p>
              <span className="text-xs text-gray-400">{getRelativeTime(activity.createdAt)}</span>
            </div>
            <p className="text-xs text-gray-400">
              {getActivityAction(activity)}{" "}
              <span className="text-white">{activity.entityType || 'item'}</span>
              {activity.amount ? ` · ${formatCurrency(activity.amount)}` : ""}
            </p>
          </div>
          
          <Badge
            variant={getBadgeVariant(activity.status)}
            className="ml-auto"
          >
            {activity.status || 'Unknown'}
          </Badge>
        </div>
      ))}
    </div>
  );
};

// Mock data to use as fallback
const mockActivities = [
  {
    id: 1,
    userId: "user123",
    amount: 149,
    status: "SUCCESS",
    orderId: "ORD-001",
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    user: {
      name: "Alex Johnson",
      email: "alex@example.com",
    },
    entityType: "VIP Ticket",
  },
  {
    id: 2,
    userId: "user456",
    amount: 49,
    status: "REFUNDED",
    orderId: "ORD-002",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    user: {
      name: "Samantha Lee",
      email: "sam@example.com",
    },
    entityType: "Basic Pass",
  },
  {
    id: 3,
    userId: "user789",
    amount: 99,
    status: "SUCCESS",
    orderId: "ORD-003",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: {
      name: "David Chen",
      email: "david@example.com",
    },
    entityType: "Premium Plan",
  },
  {
    id: 4,
    userId: "user321",
    amount: 0,
    status: "CANCELLED",
    orderId: "ORD-004",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    user: {
      name: "Emily Wilson",
      email: "emily@example.com",
    },
    entityType: "Event Registration",
  },
];

export default RecentActivityCard;
