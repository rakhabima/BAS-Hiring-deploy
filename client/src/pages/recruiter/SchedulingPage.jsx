import { ArrowBack, ArrowForward, Close, Email, Phone } from '@mui/icons-material';
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService, jobApplicationService } from '../../services/api';

const months = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const weekdays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const SchedulingPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedDayInterviews, setSelectedDayInterviews] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Check user role - only recruiter should have access
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'RECRUITER') {
      navigate('/login');
    }
  }, [navigate]);
  
  // Function to format date: "Selasa, 9 Februari 2025"
  const formatDateLong = (date) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(d);
    
    return `${dayName}, ${day} ${month} ${year}`;
  };
  
  // Function to format time: "13.00-13.45 WIB"
  const formatTimeRange = (date) => {
    const d = new Date(date);
    
    // For demo purposes, assume all interviews last 45 minutes
    const startTime = d.toLocaleTimeString('id-ID', { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const endTime = new Date(d.getTime() + 45 * 60000).toLocaleTimeString('id-ID', { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return `${startTime.replace(':', '.')}–${endTime.replace(':', '.')} WIB`;
  };

  // Fetch interview data
  const fetchInterviews = async () => {
    try {
      setLoading(true);
      
      const response = await interviewService.getAllInterviews();
      if (response && response.data) {
        setInterviews(response.data);
      } else {
        setInterviews([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError('Failed to fetch interview schedules. Please try again.');
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch application details
  const fetchApplicationDetails = async (applicationId) => {
    try {
      setLoadingDetails(true);
      const response = await jobApplicationService.getApplicationById(applicationId);
      if (response && response.data) {
        setSelectedApplication(response.data);
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Generate calendar days for the current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month and count of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Adjust day of week to start from Monday (1) instead of Sunday (0)
    let dayOfWeek = firstDay.getDay() || 7;
    dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    const days = [];
    
    // Add previous month's days to complete the first week
    for (let i = 1; i < dayOfWeek; i++) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      const prevDate = new Date(year, month - 1, prevMonthLastDay - (dayOfWeek - i - 1));
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        day: prevDate.getDate()
      });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        day: i
      });
    }
    
    // Add days from next month to fill out the calendar grid
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const nextDate = new Date(year, month + 1, i);
        days.push({
          date: nextDate,
          isCurrentMonth: false,
          day: i
        });
      }
    }
    
    setCalendarDays(days);
  }, [currentDate]);
  
  // Fetch interview data
  useEffect(() => {
    fetchInterviews();
  }, [currentDate]);
  
  // Navigate to previous month
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  // Open interview details dialog
  const handleDayClick = (day) => {
    // If this day is not in current month, ignore click
    if (!day.isCurrentMonth) return;
    
    // Find interviews for this day
    const interviewsOnDay = interviews.filter(interview => {
      const interviewDate = new Date(interview.interviewDate);
      return (
        interviewDate.getFullYear() === day.date.getFullYear() &&
        interviewDate.getMonth() === day.date.getMonth() &&
        interviewDate.getDate() === day.date.getDate()
      );
    });
    
    if (interviewsOnDay.length > 0) {
      setSelectedDayInterviews(interviewsOnDay);
      setSelectedInterview(interviewsOnDay[0]);
      setSelectedApplication(null);
      setDialogOpen(true);
      
      // Fetch application details for the first interview
      if (interviewsOnDay[0].applicationId) {
        fetchApplicationDetails(interviewsOnDay[0].applicationId);
      }
    }
  };
  
  // Select an interview from the list
  const handleSelectInterview = (interview) => {
    setSelectedInterview(interview);
    setSelectedApplication(null);
    
    // Fetch application details for the selected interview
    if (interview.applicationId) {
      fetchApplicationDetails(interview.applicationId);
    }
  };
  
  // Check if a day has interviews
  const hasInterviews = (day) => {
    return interviews.some(interview => {
      const interviewDate = new Date(interview.interviewDate);
      return (
        interviewDate.getFullYear() === day.date.getFullYear() &&
        interviewDate.getMonth() === day.date.getMonth() &&
        interviewDate.getDate() === day.date.getDate()
      );
    });
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedInterview(null);
    setSelectedApplication(null);
  };
  
  // Function to get the first letter of a name (for avatar)
  const getFirstLetter = () => {
    if (selectedApplication?.candidateInfo?.name) {
      return selectedApplication.candidateInfo.name.charAt(0).toUpperCase();
    }
    if (selectedApplication?.nama_ktp) {
      return selectedApplication.nama_ktp.charAt(0).toUpperCase();
    }
    return '?';
  };
  
  // Function to get the candidate's name
  const getCandidateName = () => {
    if (selectedApplication?.candidateInfo?.name) {
      return selectedApplication.candidateInfo.name;
    }
    if (selectedApplication?.nama_ktp) {
      return selectedApplication.nama_ktp;
    }
    return 'Kandidat';
  };
  
  // Function to get the job position
  const getJobPosition = () => {
    if (selectedApplication?.jobPostingId?.jobPosition) {
      return selectedApplication.jobPostingId.jobPosition;
    }
    if (selectedApplication?.posisi_dilamar) {
      return selectedApplication.posisi_dilamar;
    }
    return 'Posisi Tidak Tersedia';
  };
  
  // Function to get candidate email
  const getCandidateEmail = () => {
    if (selectedApplication?.candidateInfo?.email) {
      return selectedApplication.candidateInfo.email;
    }
    if (selectedApplication?.email) {
      return selectedApplication.email;
    }
    return 'Email Tidak Tersedia';
  };
  
  // Function to get candidate phone
  const getCandidatePhone = () => {
    if (selectedApplication?.candidateInfo?.phone) {
      return selectedApplication.candidateInfo.phone;
    }
    if (selectedApplication?.no_hp) {
      return selectedApplication.no_hp;
    }
    return 'No. Telepon Tidak Tersedia';
  };
  
  // Function to parse and format reschedule request JSON
  const formatRescheduleRequest = (rescheduleRequestJson) => {
    try {
      const rescheduleInfo = JSON.parse(rescheduleRequestJson);
      
      let result = '';
      
      // Format the preferred date if available
      if (rescheduleInfo.date) {
        const preferredDate = new Date(rescheduleInfo.date);
        const day = preferredDate.getDate();
        const month = months[preferredDate.getMonth()];
        const year = preferredDate.getFullYear();
        result += `Tanggal yang diusulkan: ${day} ${month} ${year}`;
      }
      
      // Add the reason if available
      if (rescheduleInfo.reason) {
        if (result) result += '\n';
        result += `Alasan: ${rescheduleInfo.reason}`;
      }
      
      return result || rescheduleRequestJson; // Fall back to original if no fields found
    } catch (error) {
      // If parsing fails, return the original string
      return rescheduleRequestJson;
    }
  };
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold italic" align="center">
        Jadwal Wawancara
      </Typography>

      <Box sx={{ my: 3 }}>
        
        {/* Calendar header with navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handlePreviousMonth}>
              <ArrowBack />
            </IconButton>
            
            <Typography variant="h6" sx={{ mx: 2 }}>
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
            
            <IconButton onClick={handleNextMonth}>
              <ArrowForward />
            </IconButton>
          </Box>
        </Box>
        
        {/* Loading indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* Error message */}
        {error && (
          <Box sx={{ my: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        
        {/* Calendar grid */}
        {!loading && !error && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {weekdays.map(day => (
                    <TableCell key={day} align="center" sx={{ fontWeight: 'bold' }}>
                      {day}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
                  <TableRow key={weekIndex}>
                    {weekdays.map((_, dayIndex) => {
                      const dayObj = calendarDays[weekIndex * 7 + dayIndex];
                      if (!dayObj) return <TableCell key={dayIndex} />;
                      
                      const isToday = new Date().toDateString() === dayObj.date.toDateString();
                      const hasInterviewsToday = hasInterviews(dayObj);
                      
                      return (
                        <TableCell 
                          key={dayIndex}
                          align="center"
                          onClick={() => handleDayClick(dayObj)}
                          sx={{
                            color: !dayObj.isCurrentMonth ? 'text.disabled' : 'text.primary',
                            backgroundColor: isToday ? 'action.selected' : 'inherit',
                            fontWeight: isToday ? 'bold' : 'normal',
                            height: '80px',
                            width: '14.28%',
                            cursor: hasInterviewsToday ? 'pointer' : 'default',
                            position: 'relative',
                            padding: '8px',
                            '&:hover': hasInterviewsToday ? {
                              backgroundColor: 'action.hover'
                            } : {}
                          }}
                        >
                          <Box sx={{ 
                            position: 'absolute', 
                            top: '8px', 
                            left: '8px', 
                            textAlign: 'left'
                          }}>
                            {dayObj.day}
                          </Box>
                          
                          {hasInterviewsToday && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: '8px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'primary.main',
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Wawancara
                            </Box>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      
      {/* Interview details dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2
        }}>
          <Typography variant="h6">Jadwal Wawancara - {selectedDayInterviews.length > 0 ? formatDateLong(selectedDayInterviews[0].interviewDate) : ''}</Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {selectedDayInterviews.length > 0 && (
            <Box>
              {selectedDayInterviews.length > 1 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Daftar Wawancara ({selectedDayInterviews.length})
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1,
                    mb: 2 
                  }}>
                    {selectedDayInterviews.map((interview, index) => {
                      const time = new Date(interview.interviewDate).toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: false 
                      }).replace(':', '.');
                      
                      return (
                        <Chip
                          key={index}
                          label={`${time} - ID: ${interview.applicationId ? interview.applicationId.substring(0, 8) : 'N/A'}`}
                          onClick={() => handleSelectInterview(interview)}
                          color={selectedInterview === interview ? "primary" : "default"}
                          variant={selectedInterview === interview ? "filled" : "outlined"}
                          sx={{ mb: 1 }}
                        />
                      );
                    })}
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                </Box>
              )}

              {selectedInterview && (
                <>
                  {loadingDetails ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <>
                      {/* Candidate info */}
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 3
                      }}>
                        <Box sx={{ 
                          width: 80, 
                          height: 80, 
                          bgcolor: 'grey.400', 
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1
                        }}>
                          <Typography variant="h4" color="white">
                            {getFirstLetter()}
                          </Typography>
                        </Box>
                        
                        <Typography variant="h6" align="center">
                          {getCandidateName()}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" align="center">
                          {getJobPosition()}
                        </Typography>
                      </Box>
                      
                      {/* Contact info */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Email sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" component="a" href={`mailto:${getCandidateEmail()}`}>
                              {getCandidateEmail()}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" component="a" href={`tel:${getCandidatePhone()}`}>
                              {getCandidatePhone()}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      {/* Interview details */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                          Detail Wawancara
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={4} sm={3}>
                            <Typography variant="body2" color="text.secondary">Tanggal</Typography>
                          </Grid>
                          <Grid item xs={8} sm={9}>
                            <Typography variant="body2">
                              {formatDateLong(selectedInterview.interviewDate)}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={4} sm={3}>
                            <Typography variant="body2" color="text.secondary">Waktu</Typography>
                          </Grid>
                          <Grid item xs={8} sm={9}>
                            <Typography variant="body2">
                              {formatTimeRange(selectedInterview.interviewDate)}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={4} sm={3}>
                            <Typography variant="body2" color="text.secondary">Metode</Typography>
                          </Grid>
                          <Grid item xs={8} sm={9}>
                            <Typography variant="body2">
                              {selectedInterview.isOnline ? 'Daring' : 'Luring'}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={4} sm={3}>
                            <Typography variant="body2" color="text.secondary">Detail Lokasi</Typography>
                          </Grid>
                          <Grid item xs={8} sm={9}>
                            {selectedInterview.isOnline ? (
                              <Typography 
                                variant="body2" 
                                component="a" 
                                href={selectedInterview.meetingLink} 
                                target="_blank"
                                sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                              >
                                {selectedInterview.meetingLink || 'Link meeting tidak tersedia'}
                              </Typography>
                            ) : (
                              <Typography variant="body2">
                                {selectedInterview.location || 'Lokasi tidak tersedia'}
                              </Typography>
                            )}
                          </Grid>

                          <Grid item xs={4} sm={3}>
                            <Typography variant="body2" color="text.secondary">Status</Typography>
                          </Grid>
                          <Grid item xs={8} sm={9}>
                            <Typography variant="body2">
                              {selectedInterview.status || 'SCHEDULED'}
                            </Typography>
                          </Grid>
                          
                          {/* Show attendance if available */}
                          {selectedInterview.candidateAttendance && (
                            <>
                              <Grid item xs={4} sm={3}>
                                <Typography variant="body2" color="text.secondary">Konfirmasi Kehadiran</Typography>
                              </Grid>
                              <Grid item xs={8} sm={9}>
                                <Typography variant="body2">
                                  {selectedInterview.candidateAttendance === 'hadir' ? 'Hadir' : 
                                  selectedInterview.candidateAttendance === 'tidak_hadir' ? 'Tidak Hadir' : 
                                  'Belum Konfirmasi'}
                                </Typography>
                              </Grid>
                            </>
                          )}
                          
                          {/* Show notes if available */}
                          {selectedInterview.notes && (
                            <>
                              <Grid item xs={4} sm={3}>
                                <Typography variant="body2" color="text.secondary">Catatan</Typography>
                              </Grid>
                              <Grid item xs={8} sm={9}>
                                <Typography variant="body2">
                                  {selectedInterview.notes}
                                </Typography>
                              </Grid>
                            </>
                          )}
                          
                          {/* Show reschedule request if available */}
                          {selectedInterview.rescheduleRequest && (
                            <>
                              <Grid item xs={4} sm={3}>
                                <Typography variant="body2" color="text.secondary">Permintaan Reschedule</Typography>
                              </Grid>
                              <Grid item xs={8} sm={9}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                  {formatRescheduleRequest(selectedInterview.rescheduleRequest)}
                                </Typography>
                              </Grid>
                            </>
                          )}
                        </Grid>
                      </Box>
                    </>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default SchedulingPage; 