import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import MarkunreadIcon from '@mui/icons-material/Markunread';
import {
    Box,
    Container,
    IconButton,
    Pagination,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Typography,
    useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/api';

const NotificationPage = () => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Get user data
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.uuid;
  
  const fetchNotifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const params = {
        page,
        limit: itemsPerPage,
        type: 'OUTSOURCING_REQUEST',
        read: tabValue === 1 // 0 = unread, 1 = read
      };
      
      const result = await notificationService.getNotifications(userId, params);
      if (result.success) {
        setNotifications(result.notifications || []);
        setTotalPages(Math.ceil((result.total || 0) / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchNotifications();
  }, [userId, page, tabValue]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1); // Reset to first page when changing tabs
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  const handleToggleReadStatus = async (notification) => {
    try {
      if (notification.readStatus) {
        // Use the new markAsUnread endpoint
        console.log('Marking notification as unread:', notification.uuid);
        const result = await notificationService.markAsUnread(notification.uuid);
        
        if (result.success) {
          console.log('Successfully marked notification as unread:', result);
          // Refresh notifications instead of just modifying state
          fetchNotifications();
        } else {
          console.error('Failed to mark notification as unread:', result);
        }
      } else {
        console.log('Marking notification as read:', notification.uuid);
        const result = await notificationService.markAsRead(notification.uuid);
        
        if (result.success) {
          console.log('Successfully marked notification as read:', result);
          // Refresh notifications instead of just modifying state
          fetchNotifications();
        } else {
          console.error('Failed to mark notification as read:', result);
        }
      }
    } catch (error) {
      console.error('Error changing notification status:', error);
    }
  };
  
  const formatNotificationDate = (date) => {
    return format(new Date(date), 'dd MMMM yyyy - HH:mm', { locale: id });
  };
  
  // Parse notification message to extract data
  const parseNotificationContent = (message) => {
    try {
      // Example message format: "Permintaan Outsourcing baru dari Company XYZ (xyz@email.com) untuk layanan IT Services: Pesan permintaan detail..."
      const companyMatch = message.match(/dari (.*?) \(/);
      const emailMatch = message.match(/\((.*?)\)/);
      const categoryMatch = message.match(/untuk layanan (.*?):/);
      const messageMatch = message.match(/: (.*)/);
      
      return {
        company: companyMatch?.[1] || 'N/A',
        email: emailMatch?.[1] || 'N/A',
        category: categoryMatch?.[1] || 'N/A',
        message: messageMatch?.[1] || message
      };
    } catch (error) {
      console.error('Error parsing notification:', error);
      return { company: 'N/A', email: 'N/A', category: 'N/A', message };
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Notifikasi Permintaan Outsourcing
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="notification tabs">
            <Tab label="Belum Dibaca" />
            <Tab label="Sudah Dibaca" />
          </Tabs>
        </Box>
        
        {notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="body1" color="text.secondary">
              {tabValue === 0 
                ? 'Tidak ada permintaan baru yang belum dibaca' 
                : 'Tidak ada permintaan yang sudah dibaca'}
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table>
              <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100] }}>
                <TableRow>
                  <TableCell width="20%">Perusahaan</TableCell>
                  <TableCell width="20%">Email</TableCell>
                  <TableCell width="15%">Kategori Layanan</TableCell>
                  <TableCell width="25%">Pesan</TableCell>
                  <TableCell width="15%">Tanggal</TableCell>
                  <TableCell width="5%" align="center">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications.map((notification) => {
                  const content = parseNotificationContent(notification.message);
                  return (
                    <TableRow 
                      key={notification.uuid}
                      sx={{ 
                        '&:hover': { bgcolor: theme.palette.action.hover },
                        bgcolor: notification.readStatus ? 'inherit' : alpha(theme.palette.primary.light, 0.05)
                      }}
                    >
                      <TableCell>{content.company}</TableCell>
                      <TableCell>{content.email}</TableCell>
                      <TableCell>{content.category}</TableCell>
                      <TableCell>{content.message}</TableCell>
                      <TableCell>{formatNotificationDate(notification.dateCreated)}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small"
                          onClick={() => handleToggleReadStatus(notification)}
                          color={notification.readStatus ? 'default' : 'primary'}
                        >
                          {notification.readStatus 
                            ? <MarkunreadIcon fontSize="small" /> 
                            : <MarkEmailReadIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationPage; 