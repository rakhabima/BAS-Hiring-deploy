import { FilterList, Search } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobVacancyService } from '../../services/api';
import { formatDate } from '../../utils/formatDate';

const PublicJobListPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: 'all',
    jobType: 'all',
    jobPosition: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [locations, setLocations] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);

  // Fetch job vacancies
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await jobVacancyService.getAllJobVacancies();
        
        // Show both active and closed jobs in public view
        setJobs(response.data);
        setFilteredJobs(response.data);
        
        // Extract unique locations and job positions for filters
        const uniqueLocations = [...new Set(response.data.map(job => job.location))];
        const uniquePositions = [...new Set(response.data.map(job => job.jobPosition))];
        
        setLocations(uniqueLocations);
        setJobPositions(uniquePositions);
      } catch (err) {
        console.error('Error fetching job vacancies:', err);
        setError('Failed to fetch job vacancies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Handle search and filter
  useEffect(() => {
    let result = jobs;
    
    // Apply search term filter
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(lowercasedSearch) ||
        job.description.toLowerCase().includes(lowercasedSearch) ||
        job.jobPosition.toLowerCase().includes(lowercasedSearch)
      );
    }
    
    // Apply location filter
    if (filters.location !== 'all') {
      result = result.filter(job => job.location === filters.location);
    }
    
    // Apply job type filter
    if (filters.jobType !== 'all') {
      result = result.filter(job => job.jobType === filters.jobType);
    }
    
    // Apply job position filter
    if (filters.jobPosition !== 'all') {
      result = result.filter(job => job.jobPosition === filters.jobPosition);
    }
    
    setFilteredJobs(result);
  }, [searchTerm, filters, jobs]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setFilters({
      location: 'all',
      jobType: 'all',
      jobPosition: 'all'
    });
    setSearchTerm('');
  };

  const getJobTypeText = (type) => {
    switch (type) {
      case 'FULL_TIME':
        return 'Full Time';
      case 'PART_TIME':
        return 'Part Time';
      case 'CONTRACT':
        return 'Contract';
      default:
        return type;
    }
  };

  const viewJobDetails = (id) => {
    navigate(`/lowongan/${id}`);
  };

  // Add a status badge component
  const getStatusBadge = (status) => {
    return (
      <Box 
        component="span" 
        sx={{ 
          backgroundColor: status === 'ACTIVE' ? '#e6f4ea' : '#fce8e6',
          color: status === 'ACTIVE' ? '#137333' : '#c5221f',
          fontWeight: 'medium',
          px: 1.5,
          py: 0.5,
          borderRadius: '16px',
          fontSize: '0.75rem',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        {status === 'ACTIVE' ? 'Aktif' : 'Tutup'}
      </Box>
    );
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography color="error" variant="h6" align="center">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Lowongan Pekerjaan
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Temukan peluang karir terbaru dari kami
        </Typography>

        <Box display="flex" alignItems="center" mb={3}>
          <TextField
            fullWidth
            placeholder="Cari lowongan pekerjaan..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          <IconButton onClick={toggleFilters} sx={{ ml: 1 }}>
            <FilterList />
          </IconButton>
        </Box>

        {showFilters && (
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="location-label">Lokasi</InputLabel>
                  <Select
                    labelId="location-label"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    label="Lokasi"
                  >
                    <MenuItem value="all">Semua Lokasi</MenuItem>
                    {locations.map((location) => (
                      <MenuItem key={location} value={location}>
                        {location}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="job-type-label">Durasi</InputLabel>
                  <Select
                    labelId="job-type-label"
                    name="jobType"
                    value={filters.jobType}
                    onChange={handleFilterChange}
                    label="Durasi"
                  >
                    <MenuItem value="all">Semua Durasi</MenuItem>
                    <MenuItem value="FULL_TIME">Full Time</MenuItem>
                    <MenuItem value="PART_TIME">Part Time</MenuItem>
                    <MenuItem value="CONTRACT">Contract</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="job-position-label">Posisi</InputLabel>
                  <Select
                    labelId="job-position-label"
                    name="jobPosition"
                    value={filters.jobPosition}
                    onChange={handleFilterChange}
                    label="Posisi"
                  >
                    <MenuItem value="all">Semua Posisi</MenuItem>
                    {jobPositions.map((position) => (
                      <MenuItem key={position} value={position}>
                        {position}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" onClick={resetFilters} fullWidth>
                  Reset Filter
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {filteredJobs.length > 0 ? (
          <Grid container spacing={3} mt={2}>
            {filteredJobs.map((job) => (
              <Grid item xs={12} md={6} lg={4} key={job.id}>
                <Card 
                  elevation={3} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom noWrap>
                        {job.title}
                      </Typography>
                      {getStatusBadge(job.status)}
                    </Box>
                    <Typography variant="subtitle1" color="primary.main" gutterBottom>
                      {job.jobPosition}
                    </Typography>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        gap: 1,
                        flexWrap: 'wrap',
                        mb: 2 
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          backgroundColor: 'action.hover',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem'
                        }}
                      >
                        {job.location}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          backgroundColor: 'action.hover',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem'
                        }}
                      >
                        {getJobTypeText(job.jobType)}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {job.description.slice(0, 150)}
                      {job.description.length > 150 ? '...' : ''}
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Deadline: {formatDate(job.deadline)}
                        </Typography>
                        <Button 
                          size="small" 
                          color="primary" 
                          onClick={() => viewJobDetails(job.id)}
                        >
                          Detail
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper elevation={1} sx={{ p: 4, mt: 2 }}>
            <Typography variant="h6" align="center">
              Tidak ada lowongan yang sesuai dengan kriteria pencarian.
            </Typography>
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default PublicJobListPage; 