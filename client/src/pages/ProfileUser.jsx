import PersonIcon from '@mui/icons-material/Person';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import WorkIcon from '@mui/icons-material/Work';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { userService } from '../services/api';

const ProfileUser = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [fieldToUpdate, setFieldToUpdate] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
          setUser(userData);
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear errors for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
    
    // Real-time validation for different fields
    const newErrors = { ...errors };
    
    if (name === 'email') {
      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        newErrors.email = 'Email tidak boleh kosong';
      } else if (!emailRegex.test(value)) {
        newErrors.email = 'Format email tidak valid';
      } else {
        newErrors.email = null;
      }
    }
    else if (name === 'newPassword') {
      // Validasi kompleksitas password
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (value && !passwordRegex.test(value)) {
        newErrors.newPassword = 'Kata sandi harus minimal 8 karakter, mengandung huruf kapital, huruf kecil, dan angka';
      } else {
        newErrors.newPassword = null;
      }
      
      // Juga validasi kecocokan dengan konfirmasi password
      if (value && formData.confirmPassword && value !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok';
      } else if (value && formData.confirmPassword && value === formData.confirmPassword) {
        newErrors.confirmPassword = null;
      }
    }
    else if (name === 'confirmPassword') {
      // Validasi kecocokan dengan password baru
      if (formData.newPassword && value && formData.newPassword !== value) {
        newErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok';
      } else {
        newErrors.confirmPassword = null;
      }
    }
    
    setErrors(newErrors);
  };

  // Validate form
  const validateForm = (field) => {
    const newErrors = { ...errors };
    
    if (field === 'name' || field === 'all') {
      if (!formData.name.trim()) {
        newErrors.name = 'Nama tidak boleh kosong';
      } else {
        newErrors.name = null;
      }
    }
    
    if (field === 'email' || field === 'all') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        newErrors.email = 'Email tidak boleh kosong';
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Format email tidak valid';
      } else {
        newErrors.email = null;
      }
    }
    
    if (field === 'password' || field === 'all') {
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          newErrors.currentPassword = 'Kata sandi saat ini wajib diisi';
        } else {
          newErrors.currentPassword = null;
        }

        // Password validation requirements
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(formData.newPassword)) {
          newErrors.newPassword = 'Kata sandi harus minimal 8 karakter, mengandung huruf kapital, huruf kecil, dan angka';
        } else {
          newErrors.newPassword = null;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Konfirmasi kata sandi tidak cocok';
        } else {
          newErrors.confirmPassword = null;
        }
      }
    }
    
    setErrors(newErrors);
    
    if (field === 'all') {
      return !Object.values(newErrors).some(error => error);
    }
    
    return !newErrors[field];
  };

  // Open confirmation dialog
  const handleOpenDialog = async (field) => {
    if (validateForm(field)) {
      // Jika ingin update password, verifikasi password saat ini terlebih dahulu
      if (field === 'password') {
        setLoading(true);
        try {
          // Verifikasi password saat ini
          const isValid = await userService.verifyCurrentPassword(user.uuid, formData.currentPassword);
          
          if (!isValid) {
            setErrors({
              ...errors,
              currentPassword: 'Password saat ini tidak valid',
              general: null
            });
            setLoading(false);
            return;
          }
          
          // Password valid, lanjutkan dengan dialog konfirmasi
          setFieldToUpdate(field);
          setOpenDialog(true);
        } catch (error) {
          console.error('Error verifying password:', error);
          setErrors({
            ...errors,
            general: 'Gagal memverifikasi password saat ini'
          });
        } finally {
          setLoading(false);
        }
      } else {
        // Untuk field lain, langsung buka dialog
        setFieldToUpdate(field);
        setOpenDialog(true);
      }
    }
  };

  // Close confirmation dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle update submission
  const handleUpdate = async () => {
    setOpenDialog(false);
    
    if (!user || !user.uuid) {
      setErrors({ general: 'Informasi pengguna tidak ditemukan' });
      return;
    }
    
    try {
      let updateData = {};
      
      if (fieldToUpdate === 'name') {
        updateData = { name: formData.name };
      } else if (fieldToUpdate === 'email') {
        updateData = { email: formData.email };
      } else if (fieldToUpdate === 'password') {
        updateData = { 
          password: formData.newPassword,
          currentPassword: formData.currentPassword 
        };
      }
      
      setLoading(true);
      const response = await userService.updateUser(user.uuid, updateData);
      setLoading(false);
      
      if (response && response.success) {
        // Update local storage with new user data
        const updatedUser = {
          ...user,
          ...(fieldToUpdate !== 'password' ? updateData : {}),
          // Don't save password to localStorage
          password: undefined,
          currentPassword: undefined
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Reset password fields
        if (fieldToUpdate === 'password') {
          setFormData({
            ...formData,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
        
        setUpdateSuccess(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ 
        general: error.response?.data?.message || 'Gagal memperbarui profil'
      });
      setLoading(false);
    }
  };

  // Check if there are password errors
  const hasPasswordErrors = () => {
    // Validasi ulang password saat ini untuk memastikan persyaratan kompleksitas terpenuhi
    if (formData.newPassword) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      
      if (!passwordRegex.test(formData.newPassword)) {
        return true; // Password tidak memenuhi persyaratan kompleksitas
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        return true; // Konfirmasi password tidak cocok
      }
      
      if (!formData.currentPassword) {
        return true; // Password saat ini tidak diisi
      }
    }
    
    return Boolean(
      errors.currentPassword || 
      errors.newPassword || 
      errors.confirmPassword
    );
  };
  
  // Check if there are email errors
  const hasEmailErrors = () => {
    if (!formData.email || !formData.email.trim()) {
      return true; // Email kosong
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return true; // Format email tidak valid
    }
    
    return Boolean(errors.email);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h6">Memuat data profil...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon fontSize="large" sx={{ mr: 2 }} />
          <Typography variant="h4">Profil Pengguna</Typography>
        </Box>
        
        <Typography variant="subtitle1" color="text.secondary" mb={2}>
          Atur informasi nama dan akun anda disini.
        </Typography>
        
        <Divider sx={{ mb: 4 }} />
        
        {updateSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profil berhasil diperbarui!
          </Alert>
        )}
        
        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}
        
        <Typography variant="h6" sx={{ mb: 2 }}>Data Diri</Typography>
        
        <Grid container spacing={3}>
          {/* Nama */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Nama</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  variant="outlined"
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                  disabled={loading}
                  sx={{ mr: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleOpenDialog('name')}
                  disabled={loading || formData.name === user?.name}
                >
                  Ubah
                </Button>
              </Box>
            </Box>
          </Grid>
        
          {/* Email */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Email</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  variant="outlined"
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  disabled={loading}
                  sx={{ mr: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleOpenDialog('email')}
                  disabled={loading || formData.email === user?.email || hasEmailErrors()}
                >
                  Ubah
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Password</Typography>
        
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={3}>
            {/* Current Password */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Kata Sandi Saat Ini</Typography>
              <TextField
                fullWidth
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange}
                variant="outlined"
                error={Boolean(errors.currentPassword)}
                helperText={errors.currentPassword}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* New Password */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Kata Sandi Baru</Typography>
              <TextField
                fullWidth
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                variant="outlined"
                error={Boolean(errors.newPassword)}
                helperText={errors.newPassword}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Confirm Password */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Konfirmasi Kata Sandi</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  variant="outlined"
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword}
                  disabled={loading}
                  sx={{ mr: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleOpenDialog('password')}
                  disabled={loading || !formData.newPassword || hasPasswordErrors()}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Ubah'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        {/* Special section for CANDIDATE role */}
        {user && user.role === 'CANDIDATE' && (
          <>
            <Divider sx={{ my: 4 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <WorkIcon fontSize="large" sx={{ mr: 2 }} />
              <Typography variant="h5">Portal Lamaran Pekerjaan</Typography>
            </Box>
            <Typography variant="body1" paragraph>
              Anda dapat melihat dan mengatur lamaran pekerjaan yang telah Anda ajukan.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<WorkIcon />}
              onClick={() => {}}
              sx={{ mt: 2 }}
            >
              Lihat Portal Lamaran
            </Button>
          </>
        )}
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Konfirmasi Update</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {fieldToUpdate === 'name' && 'Apakah Anda yakin ingin mengubah nama Anda?'}
            {fieldToUpdate === 'email' && 'Apakah Anda yakin ingin mengubah email Anda?'}
            {fieldToUpdate === 'password' && 'Apakah Anda yakin ingin mengubah kata sandi Anda?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Batal
          </Button>
          <Button onClick={handleUpdate} color="primary" variant="contained">
            Ya, Ubah
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfileUser; 