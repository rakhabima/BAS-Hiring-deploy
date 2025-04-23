import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, LocationOn, Search as SearchIcon, Work as WorkIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobVacancyService } from '../../services/api';
const defaultImage = '/assets/baslogo.png';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  position: 'relative',
  transition: 'transform 0.3s ease-in-out',
  maxWidth: '100%',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10],
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '10px',
  zIndex: 1,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.background.default,
  },
}));

const JobPublicationsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobPositionFilter, setJobPositionFilter] = useState('');
  const [locations, setLocations] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  
  // Check user role
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'RECRUITER') {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await jobVacancyService.getAllJobVacancies();
        
        // Auto-update status for jobs where deadline has passed
        // This only affects display status on the client side
        const updatedJobs = response.data.map(job => {
          const deadlineDate = new Date(job.deadline);
          const today = new Date();
          
          // Auto-update to CLOSED if deadline has passed (only for ACTIVE jobs)
          if (deadlineDate < today && job.status === 'ACTIVE') {
            // Call the API to update the job status
            jobVacancyService.updateJobVacancy(job.uuid || job.id, {
              ...job,
              status: 'CLOSED'
            }).catch(err => {
              console.error(`Failed to auto-update status for job ${job.uuid || job.id}:`, err);
            });
            
            // Update the local job state immediately
            return {
              ...job,
              status: 'CLOSED'
            };
          }
          
          return job;
        });
        
        setJobs(updatedJobs || []);
        
        // Extract unique locations and job positions for filters
        const uniqueLocations = [...new Set(updatedJobs.map(job => job.location))];
        const uniquePositions = [...new Set(updatedJobs.map(job => job.jobPosition).filter(Boolean))];
        
        setLocations(uniqueLocations);
        setJobPositions(uniquePositions);
      } catch (err) {
        setError('Failed to load job vacancies');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleDeleteClick = (jobId) => {
    setConfirmDelete(jobId);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    
    try {
      await jobVacancyService.deleteJobVacancy(confirmDelete);
      // Remove deleted job from the list
      setJobs(jobs.filter(job => job.uuid !== confirmDelete));
    } catch (err) {
      console.error('Error deleting job:', err);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleCreateNew = () => {
    navigate('/recruiter/job-publications/create');
  };

  const handleEditJob = (jobId) => {
    navigate(`/recruiter/job-publications/edit/${jobId}`);
  };

  const handleViewDetails = (jobId) => {
    navigate(`/recruiter/job-publications/${jobId}`);
  };

  // Filter jobs based on search query and filters
  const filteredJobs = jobs.filter(job => {
    const matchesQuery = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesLocation = locationFilter === '' || job.location === locationFilter;
    const matchesPosition = jobPositionFilter === '' || job.jobPosition === jobPositionFilter;
    
    return matchesQuery && matchesLocation && matchesPosition;
  });

  // Loading state
  if (loading) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Publikasi Lowongan Pekerjaan
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Lowongan
        </Button>
      </Box>

      {/* Search and filters */}
      <Paper sx={{ p: 2, mb: 4, backgroundColor: theme.palette.background.paper }}>
        <Box display="flex" flexDirection="row" gap={2} alignItems="flex-end">
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              placeholder="Cari"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ bgcolor: theme.palette.background.default, borderRadius: 1 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Lokasi
            </Typography>
            <Select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              displayEmpty
              size="medium"
              sx={{ width: '100%', bgcolor: theme.palette.background.default, borderRadius: 1 }}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="">Semua Lokasi</MenuItem>
              {locations.map((location) => (
                <MenuItem key={location} value={location}>{location}</MenuItem>
              ))}
            </Select>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Posisi Kerja
            </Typography>
            <Select
              value={jobPositionFilter}
              onChange={(e) => setJobPositionFilter(e.target.value)}
              displayEmpty
              size="medium"
              sx={{ width: '100%', bgcolor: theme.palette.background.default, borderRadius: 1 }}
              MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
            >
              <MenuItem value="">Semua Posisi</MenuItem>
              {jobPositions.map((position) => (
                <MenuItem key={position} value={position}>{position}</MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
      </Paper>

      {/* Job cards */}
      {filteredJobs.length === 0 ? (
        <Box mt={4} textAlign="center">
          <Typography variant="h6" color="text.secondary">
            Tidak ada lowongan yang ditemukan
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredJobs.map((job) => (
            <Grid item xs={12} sm={6} md={3} lg={2.4} key={job.uuid}>
              <StyledCard onClick={() => handleViewDetails(job.uuid)}>
                <ActionButton
                  aria-label="edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditJob(job.uuid);
                  }}
                  sx={{ right: 50 }}
                >
                  <EditIcon />
                </ActionButton>
                <ActionButton
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(job.uuid);
                  }}
                  sx={{ right: 10 }}
                >
                  <DeleteIcon />
                </ActionButton>
                
                <CardMedia
                  component="img"
                  image={job.imageUrl || defaultImage}
                  alt={job.title}
                  sx={{ 
                    height: 280, 
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Typography gutterBottom variant="h6" component="h2" fontWeight="bold" noWrap>
                    {job.title}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <WorkIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.9rem' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }} noWrap>
                      {job.jobPosition}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <WorkIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.9rem' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {job.jobType === 'FULL_TIME' ? 'Full Time' : job.jobType === 'PART_TIME' ? 'Part Time' : 'Contract'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOn fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.9rem' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {job.location}
                    </Typography>
                  </Box>
                  
                  <Box mt={1}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Penutupan: {formatDate(job.deadline)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Diunggah: {formatDate(job.datePosted || job.createdAt)}
                    </Typography>
                  </Box>
                  
                  <Box mt={1}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'inline-block',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: job.status === 'ACTIVE' ? 'success.light' : 'error.light',
                        color: job.status === 'ACTIVE' ? 'success.dark' : 'error.dark'
                      }}
                    >
                      {job.status === 'ACTIVE' ? 'Aktif' : 'Tutup'}
                    </Typography>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      >
        <DialogTitle>Hapus Lowongan</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin menghapus lowongan ini? Tindakan ini tidak dapat dibatalkan.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Batal</Button>
          <Button onClick={handleDeleteConfirm} color="error">Hapus</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JobPublicationsPage; 