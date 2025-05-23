import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { Badge, Box, Divider, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force re-fetch
  
  // Check if user is GM
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isGeneralManager = user?.role === 'GENERAL_MANAGER';
  
  // Fetch notifications function (memoized with useCallback)
  const fetchNotifications = useCallback(async () => {
    if (!isGeneralManager || !user?.uuid) return;
    
    try {
      console.log('Fetching unread notifications for user:', user.uuid);
      const result = await notificationService.getUnreadNotifications(user.uuid);
      
      if (result.success) {
        // Filter for only OUTSOURCING_REQUEST type notifications
        const outsourcingNotifications = result.notifications.filter(
          notif => notif.type === 'OUTSOURCING_REQUEST'
        );
        
        console.log('Fetched notifications:', outsourcingNotifications.length);
        setNotifications(outsourcingNotifications);
        setUnreadCount(outsourcingNotifications.length);
      } else {
        console.error('Failed to fetch notifications:', result);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user?.uuid, isGeneralManager]);
  
  // Force refresh of notifications
  const refreshNotifications = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  useEffect(() => {
    // Load notifications when component mounts or refresh is triggered
    fetchNotifications();
    
    // Set up interval to check for new notifications
    const intervalId = setInterval(fetchNotifications, 30000); // every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchNotifications, refreshKey]);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Function to directly update the notification status in the database
  const markNotificationAsRead = async (notificationId) => {
    try {
      // Try multiple times if needed
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Attempt ${attempt} to mark notification as read: ${notificationId}`);
        
        try {
          const result = await notificationService.markAsRead(notificationId);
          
          if (result && result.success) {
            console.log(`Successfully marked notification as read (attempt ${attempt}):`, result);
            return true;
          } else {
            console.error(`Failed to mark notification as read (attempt ${attempt}):`, result);
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (innerError) {
          console.error(`Error in attempt ${attempt}:`, innerError);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.error('All attempts to mark notification as read failed');
      return false;
    } catch (error) {
      console.error('Fatal error when marking notification as read:', error);
      return false;
    }
  };
  
  const handleNotificationClick = async (notification) => {
    try {
      console.log('Processing notification click:', notification.uuid);
      
      // Update local state immediately to improve perceived performance
      setNotifications(prev => prev.filter(n => n.uuid !== notification.uuid));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Try to mark as read in the background
      markNotificationAsRead(notification.uuid)
        .then(success => {
          if (success) {
            console.log('Successfully marked notification as read:', notification.uuid);
            // Force a refresh to ensure UI is in sync
            setTimeout(refreshNotifications, 500);
          } else {
            console.error('Failed to mark notification as read after attempts:', notification.uuid);
            // If failed, refresh to get accurate state
            refreshNotifications();
          }
        })
        .catch(error => {
          console.error('Error in background mark-as-read process:', error);
          refreshNotifications();
        });
    } catch (error) {
      console.error('Exception when handling notification click:', error);
    }
    
    // Close the menu regardless of the outcome
    handleClose();
  };
  
  // Format the notification date
  const formatNotificationDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: id });
  };
  
  // Only show for General Manager
  if (!isGeneralManager) return null;
  
  return (
    <Box sx={{ display: 'inline-block' }}>
      <Tooltip title="Notifikasi Permintaan Outsourcing">
        <IconButton
          onClick={handleClick}
          size="large"
          aria-controls={open ? 'notification-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          color="inherit"
          data-testid="notification-bell"
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'notification-button',
        }}
        PaperProps={{
          style: {
            maxHeight: '70vh',
            width: '350px',
          },
        }}
      >
        <Box sx={{ p: 2, pt: 1, pb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Permintaan Outsourcing
          </Typography>
        </Box>
        <Divider />
        
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Tidak ada permintaan baru
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem 
              key={notification.uuid} 
              onClick={() => handleNotificationClick(notification)}
              sx={{ 
                whiteSpace: 'normal',
                py: 1.5,
                borderBottom: '1px solid rgba(0,0,0,0.05)'
              }}
              data-testid={`notification-item-${notification.uuid}`}
            >
              <Box>
                <Typography variant="body2" component="div">
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatNotificationDate(notification.dateCreated)}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
        
        <Divider />
        <MenuItem 
          component={Link} 
          to="/gm/notifications"
          onClick={handleClose} 
          sx={{ justifyContent: 'center' }}
        >
          <Typography variant="body2" color="primary">
            Lihat Semua Notifikasi
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default NotificationBell; 