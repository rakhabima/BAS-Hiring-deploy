import { ArrowBack, Close, Edit, PictureAsPdf, Save } from '@mui/icons-material';
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Divider,
    FormControl,
    FormHelperText,
    Grid,
    IconButton,
    MenuItem,
    Modal,
    Paper,
    Select,
    TextField,
    Typography
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobApplicationService } from '../../services/api';

const KorlapEmployeeDetailPage = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Edit states
  const [formData, setFormData] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [editableFields, setEditableFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [documentPreviews, setDocumentPreviews] = useState({
    foto_diri: null,
    foto_ktp: null,
    foto_sim: null,
    foto_stnk_hal_1: null,
    foto_stnk_hal_2: null,
    foto_ijazah: null,
  });
  
  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!employeeId) {
        navigate('/korlap/employees');
        return;
      }
      
      try {
        setLoading(true);
        // Gunakan endpoint job application untuk mendapatkan detail karyawan
        const response = await jobApplicationService.getApplicationById(employeeId);
        if (response && response.data) {
          // Hanya tampilkan karyawan dengan status ON_JOB
          if (response.data.status === 'ON_JOB' || response.data.status === 'ACCEPTED') {
            setEmployee(response.data);
            // Initialize form data with employee data and new fields
            setFormData({
              ...response.data,
              divisi: response.data.divisi || '',
              tanggal_bergabung: response.data.tanggal_bergabung || response.data.updatedAt || null,
              tanggal_berakhir_kontrak: response.data.tanggal_berakhir_kontrak || null,
              status_kerja: response.data.status_kerja || false,
            });
          } else {
            // Jika bukan karyawan, kembali ke halaman daftar karyawan
            navigate('/korlap/employees');
          }
        } else {
          navigate('/korlap/employees');
        }
      } catch (error) {
        console.error('Error fetching employee details:', error);
        navigate('/korlap/employees');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeData();
  }, [employeeId, navigate]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Handle view document
  const handleViewDocument = (documentUrl) => {
    if (documentUrl) {
      setPreviewImage(documentUrl);
    }
  };
  
  // Handle close preview
  const handleClosePreview = () => {
    setPreviewImage(null);
    setZoomed(false);
    setZoomLevel(1);
  };

  // Handle zoom in/out
  const handleZoomToggle = () => {
    setZoomed(!zoomed);
    setZoomLevel(zoomed ? 1 : 2); // Toggle between normal and zoomed
  };

  // Handle zoom level change
  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 0.5, 4)); // Max zoom 4x
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 0.5, 0.5)); // Min zoom 0.5x
  };

  // Handle back button
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };
  
  // Toggle edit mode for a field
  const toggleEditMode = (fieldName) => {
    setEditableFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const numericOnlyFields = ["nik", "no_hp", "no_hp_darurat", "no_sim", "tahun_produksi_kendaraan", "no_rekening"];

    if (numericOnlyFields.includes(name)) {
      const numericValue = value.replace(/\D/g, "");
      setFormData({
        ...formData,
        [name]: numericValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };
  
  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date,
    });

    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }

    // Validate age if the field is tanggal_lahir
    if (name === "tanggal_lahir" && date) {
      const age = calculateAge(date);
      if (age < 17 || age > 30) {
        setFormErrors({
          ...formErrors,
          [name]: "Usia karyawan harus antara 17-30 tahun",
        });
      }
    }

    // Validate expiry dates are not in the past
    if (
      (name === "masa_berlaku_sim" || name === "masa_berlaku_stnk" || name === "masa_berlaku_pajak_kendaraan") &&
      date
    ) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison

      if (date < today) {
        setFormErrors({
          ...formErrors,
          [name]: "Tanggal masa berlaku tidak boleh kurang dari hari ini",
        });
      }
    }
    
    // Validate contract end date not before today
    if (name === "tanggal_berakhir_kontrak" && date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison

      if (date < today) {
        setFormErrors({
          ...formErrors,
          [name]: "Tanggal berakhir kontrak tidak boleh kurang dari hari ini",
        });
      }
    }
  };
  
  // Handle file uploads
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors({
          ...formErrors,
          [name]: "Ukuran file tidak boleh lebih dari 5MB"
        });
        return;
      }
      
      // Check file type (only images)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setFormErrors({
          ...formErrors,
          [name]: "Format file harus JPEG, JPG, atau PNG"
        });
        return;
      }
      
      // Update form data
      setFormData({
        ...formData,
        [name]: file,
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentPreviews({
          ...documentPreviews,
          [name]: e.target.result
        });
      };
      reader.readAsDataURL(file);
      
      // Clear error for this field if it exists
      if (formErrors[name]) {
        setFormErrors({
          ...formErrors,
          [name]: "",
        });
      }
    }
  };
  
  // Calculate age from birthdate
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Handle toggle status
  const handleToggleStatus = () => {
    setFormData({
      ...formData,
      status_kerja: !formData.status_kerja
    });
  };
  
  // Validate form before saving
  const validateForm = () => {
    let errors = {};
    let isValid = true;
    
    // Personal Information
    if (editableFields.nama_ktp && !formData.nama_ktp) {
      errors.nama_ktp = 'Nama lengkap wajib diisi';
      isValid = false;
    }
    
    if (editableFields.jenis_kelamin && !formData.jenis_kelamin) {
      errors.jenis_kelamin = 'Jenis kelamin wajib dipilih';
      isValid = false;
    }
    
    if (editableFields.nik) {
      if (!formData.nik) {
        errors.nik = "NIK wajib diisi";
        isValid = false;
      } else if (formData.nik.length !== 16) {
        errors.nik = "NIK harus 16 digit";
        isValid = false;
      } else if (!/^\d+$/.test(formData.nik)) {
        errors.nik = "NIK hanya boleh berisi angka";
        isValid = false;
      }
    }
    
    if (editableFields.tanggal_lahir) {
      if (!formData.tanggal_lahir) {
        errors.tanggal_lahir = "Tanggal lahir wajib diisi";
        isValid = false;
      } else {
        const age = calculateAge(formData.tanggal_lahir);
        if (age < 17 || age > 30) {
          errors.tanggal_lahir = "Usia karyawan harus antara 17-30 tahun";
          isValid = false;
        }
      }
    }
    
    if (editableFields.agama && !formData.agama) {
      errors.agama = 'Agama wajib dipilih';
      isValid = false;
    }
    
    if (editableFields.pendidikan_terakhir && !formData.pendidikan_terakhir) {
      errors.pendidikan_terakhir = 'Pendidikan terakhir wajib dipilih';
      isValid = false;
    }
    
    // Contact Information
    if (editableFields.email) {
      if (!formData.email) {
        errors.email = 'Email wajib diisi';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Format email tidak valid';
        isValid = false;
      }
    }
    
    if (editableFields.no_hp) {
      if (!formData.no_hp) {
        errors.no_hp = "Nomor telepon wajib diisi";
        isValid = false;
      } else if (!/^\d+$/.test(formData.no_hp)) {
        errors.no_hp = "Nomor telepon hanya boleh berisi angka";
        isValid = false;
      }
    }
    
    if (editableFields.no_hp_darurat) {
      if (!formData.no_hp_darurat) {
        errors.no_hp_darurat = "Nomor telepon darurat wajib diisi";
        isValid = false;
      } else if (!/^\d+$/.test(formData.no_hp_darurat)) {
        errors.no_hp_darurat = "Nomor telepon darurat hanya boleh berisi angka";
        isValid = false;
      }
    }
    
    if (editableFields.pemilik_no_hp_darurat && !formData.pemilik_no_hp_darurat) {
      errors.pemilik_no_hp_darurat = 'Nama pemilik kontak darurat wajib diisi';
      isValid = false;
    }
    
    if (editableFields.hubungan_dgn_pemilik_no_hp_darurat && !formData.hubungan_dgn_pemilik_no_hp_darurat) {
      errors.hubungan_dgn_pemilik_no_hp_darurat = 'Hubungan dengan pemilik kontak darurat wajib diisi';
      isValid = false;
    }
    
    // Address
    if (editableFields.kota && !formData.kota) {
      errors.kota = 'Kota/Kabupaten wajib diisi';
      isValid = false;
    }
    
    if (editableFields.kecamatan && !formData.kecamatan) {
      errors.kecamatan = 'Kecamatan wajib diisi';
      isValid = false;
    }
    
    if (editableFields.kelurahan && !formData.kelurahan) {
      errors.kelurahan = 'Kelurahan wajib diisi';
      isValid = false;
    }
    
    if (editableFields.alamat && !formData.alamat) {
      errors.alamat = 'Alamat lengkap wajib diisi';
      isValid = false;
    }
    
    // Vehicle Information
    if (editableFields.tipe_sim && formData.tipe_sim !== 'Tidak Punya' && !formData.no_sim) {
      errors.no_sim = 'Nomor SIM wajib diisi';
      isValid = false;
    }
    
    if (editableFields.masa_berlaku_sim && formData.tipe_sim !== 'Tidak Punya' && !formData.masa_berlaku_sim) {
      errors.masa_berlaku_sim = 'Masa berlaku SIM wajib diisi';
      isValid = false;
    }
    
    // Additional fields validation
    if (editableFields.divisi && !formData.divisi) {
      errors.divisi = 'Divisi wajib diisi';
      isValid = false;
    }
    
    if (editableFields.tanggal_bergabung && !formData.tanggal_bergabung) {
      errors.tanggal_bergabung = 'Tanggal bergabung wajib diisi';
      isValid = false;
    }
    
    if (editableFields.tanggal_berakhir_kontrak && formData.tanggal_berakhir_kontrak) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(formData.tanggal_berakhir_kontrak) < today) {
        errors.tanggal_berakhir_kontrak = "Tanggal berakhir kontrak tidak boleh kurang dari hari ini";
        isValid = false;
      }
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Save changes
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      // Prepare form data for submission
      const formDataToSubmit = new FormData();
      
      // Add all form fields
      for (const key in formData) {
        // Skip file fields, they will be handled separately
        if (!key.startsWith('foto_')) {
          if (key === 'tipe_sim' && (!formData[key] || formData[key] === '')) {
            formDataToSubmit.append(key, 'Tidak Punya');
          } else if (formData[key] instanceof Date) {
            formDataToSubmit.append(key, formData[key].toISOString());
          } else if (formData[key] !== null && formData[key] !== undefined) {
            formDataToSubmit.append(key, formData[key]);
          }
        }
      }
      
      // Add file uploads
      const fileFields = [
        'foto_diri', 'foto_ktp', 'foto_sim', 
        'foto_stnk_hal_1', 'foto_stnk_hal_2', 'foto_ijazah'
      ];
      
      fileFields.forEach(field => {
        if (formData[field] instanceof File) {
          formDataToSubmit.append(field, formData[field]);
        }
      });
      
      // Update the employee data using the staff update method
      await jobApplicationService.updateEmployeeByStaff(employeeId, formDataToSubmit);
      
      // Refresh the data
      const response = await jobApplicationService.getApplicationById(employeeId);
      setEmployee(response.data);
      setFormData({
        ...response.data,
        divisi: response.data.divisi || '',
        tanggal_bergabung: response.data.tanggal_bergabung || response.data.updatedAt || null,
        tanggal_berakhir_kontrak: response.data.tanggal_berakhir_kontrak || null,
        status_kerja: response.data.status_kerja || false,
      });
      
      // Reset edit mode
      setEditableFields({});
      setSaving(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Back button */}
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Kembali
        </Button>
      </Box>
      
      {/* Main content */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" fontWeight="bold" sx={{ mb: 3 }}>
          Detail Data Karyawan
        </Typography>
        
        {/* Status Badge */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2 }}>Status:</Typography>
          <Box sx={{ 
            bgcolor: '#2E7D32', 
            color: 'white', 
            px: 2, 
            py: 0.5, 
            borderRadius: 1,
            display: 'inline-block'
          }}>
            <Typography variant="body2" fontWeight="medium">
              {employee?.status === 'ON_JOB' ? 'Aktif' : 'Diterima'}
            </Typography>
          </Box>
        </Box>
        
        {/* Personal Information */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3" fontWeight="bold">
          Informasi Pribadi
        </Typography>
          {Object.keys(editableFields).some(key => ['nama_ktp', 'jenis_kelamin', 'nik', 'tanggal_lahir', 'agama', 'pendidikan_terakhir'].includes(key)) ? (
            <Button 
              variant="contained" 
              color="primary" 
              size="small"
              startIcon={<Save />}
              onClick={() => handleSave()}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          ) : null}
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Nama Lengkap (sesuai KTP)</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.nama_ktp ? (
              <TextField
                fullWidth
                size="small"
                name="nama_ktp"
                value={formData.nama_ktp || ''}
                onChange={handleChange}
                error={!!formErrors.nama_ktp}
                helperText={formErrors.nama_ktp}
              />
            ) : (
            <Typography variant="body2">{employee?.nama_ktp || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('nama_ktp')}
              color={editableFields.nama_ktp ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Jenis Kelamin</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.jenis_kelamin ? (
              <FormControl fullWidth size="small" error={!!formErrors.jenis_kelamin}>
                <Select
                  name="jenis_kelamin"
                  value={formData.jenis_kelamin || ''}
                  onChange={handleChange}
                  displayEmpty
                >
                  <MenuItem value="" disabled>Pilih Jenis Kelamin</MenuItem>
                  <MenuItem value="Laki-laki">Laki-laki</MenuItem>
                  <MenuItem value="Perempuan">Perempuan</MenuItem>
                </Select>
                {formErrors.jenis_kelamin && <FormHelperText>{formErrors.jenis_kelamin}</FormHelperText>}
              </FormControl>
            ) : (
            <Typography variant="body2">{employee?.jenis_kelamin || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('jenis_kelamin')}
              color={editableFields.jenis_kelamin ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">NIK</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.nik ? (
              <TextField
                fullWidth
                size="small"
                name="nik"
                value={formData.nik || ''}
                onChange={handleChange}
                error={!!formErrors.nik}
                helperText={formErrors.nik}
                inputProps={{ maxLength: 16 }}
              />
            ) : (
            <Typography variant="body2">{employee?.nik || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('nik')}
              color={editableFields.nik ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Tanggal Lahir</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.tanggal_lahir ? (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={formData.tanggal_lahir ? new Date(formData.tanggal_lahir) : null}
                  onChange={(date) => handleDateChange('tanggal_lahir', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      error={!!formErrors.tanggal_lahir}
                      helperText={formErrors.tanggal_lahir}
                    />
                  )}
                />
              </LocalizationProvider>
            ) : (
            <Typography variant="body2">{formatDate(employee?.tanggal_lahir)}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('tanggal_lahir')}
              color={editableFields.tanggal_lahir ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Agama</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.agama ? (
              <FormControl fullWidth size="small" error={!!formErrors.agama}>
                <Select
                  name="agama"
                  value={formData.agama || ''}
                  onChange={handleChange}
                  displayEmpty
                >
                  <MenuItem value="" disabled>Pilih Agama</MenuItem>
                  <MenuItem value="Islam">Islam</MenuItem>
                  <MenuItem value="Kristen">Kristen</MenuItem>
                  <MenuItem value="Katolik">Katolik</MenuItem>
                  <MenuItem value="Hindu">Hindu</MenuItem>
                  <MenuItem value="Buddha">Buddha</MenuItem>
                  <MenuItem value="Konghucu">Konghucu</MenuItem>
                  <MenuItem value="Lainnya">Lainnya</MenuItem>
                </Select>
                {formErrors.agama && <FormHelperText>{formErrors.agama}</FormHelperText>}
              </FormControl>
            ) : (
            <Typography variant="body2">{employee?.agama || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('agama')}
              color={editableFields.agama ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Pendidikan Terakhir</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.pendidikan_terakhir ? (
              <FormControl fullWidth size="small" error={!!formErrors.pendidikan_terakhir}>
                <Select
                  name="pendidikan_terakhir"
                  value={formData.pendidikan_terakhir || ''}
                  onChange={handleChange}
                  displayEmpty
                >
                  <MenuItem value="" disabled>Pilih Pendidikan Terakhir</MenuItem>
                  <MenuItem value="SD">SD</MenuItem>
                  <MenuItem value="SMP">SMP</MenuItem>
                  <MenuItem value="SMA/SMK">SMA/SMK</MenuItem>
                  <MenuItem value="D1">D1</MenuItem>
                  <MenuItem value="D2">D2</MenuItem>
                  <MenuItem value="D3">D3</MenuItem>
                  <MenuItem value="D4">D4</MenuItem>
                  <MenuItem value="S1">S1</MenuItem>
                  <MenuItem value="S2">S2</MenuItem>
                  <MenuItem value="S3">S3</MenuItem>
                </Select>
                {formErrors.pendidikan_terakhir && <FormHelperText>{formErrors.pendidikan_terakhir}</FormHelperText>}
              </FormControl>
            ) : (
            <Typography variant="body2">{employee?.pendidikan_terakhir || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('pendidikan_terakhir')}
              color={editableFields.pendidikan_terakhir ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
        
        {/* Contact Information */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3" fontWeight="bold">
          Kontak
        </Typography>
          {Object.keys(editableFields).some(key => ['email', 'no_hp', 'no_hp_darurat', 'pemilik_no_hp_darurat', 'hubungan_dgn_pemilik_no_hp_darurat'].includes(key)) ? (
            <Button 
              variant="contained" 
              color="primary" 
              size="small"
              startIcon={<Save />}
              onClick={() => handleSave()}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          ) : null}
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Alamat Email</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.email ? (
              <TextField
                fullWidth
                size="small"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            ) : (
            <Typography variant="body2">{employee?.email || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('email')}
              color={editableFields.email ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Nomor Telepon</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.no_hp ? (
              <TextField
                fullWidth
                size="small"
                name="no_hp"
                value={formData.no_hp || ''}
                onChange={handleChange}
                error={!!formErrors.no_hp}
                helperText={formErrors.no_hp}
              />
            ) : (
            <Typography variant="body2">{employee?.no_hp || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('no_hp')}
              color={editableFields.no_hp ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Kontak Darurat</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.no_hp_darurat ? (
              <TextField
                fullWidth
                size="small"
                name="no_hp_darurat"
                value={formData.no_hp_darurat || ''}
                onChange={handleChange}
                error={!!formErrors.no_hp_darurat}
                helperText={formErrors.no_hp_darurat}
              />
            ) : (
            <Typography variant="body2">{employee?.no_hp_darurat || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('no_hp_darurat')}
              color={editableFields.no_hp_darurat ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Nama Pemilik Kontak Darurat</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.pemilik_no_hp_darurat ? (
              <TextField
                fullWidth
                size="small"
                name="pemilik_no_hp_darurat"
                value={formData.pemilik_no_hp_darurat || ''}
                onChange={handleChange}
                error={!!formErrors.pemilik_no_hp_darurat}
                helperText={formErrors.pemilik_no_hp_darurat}
              />
            ) : (
            <Typography variant="body2">{employee?.pemilik_no_hp_darurat || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('pemilik_no_hp_darurat')}
              color={editableFields.pemilik_no_hp_darurat ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Hubungan dengan Pemilik Kontak Darurat</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.hubungan_dgn_pemilik_no_hp_darurat ? (
              <TextField
                fullWidth
                size="small"
                name="hubungan_dgn_pemilik_no_hp_darurat"
                value={formData.hubungan_dgn_pemilik_no_hp_darurat || ''}
                onChange={handleChange}
                error={!!formErrors.hubungan_dgn_pemilik_no_hp_darurat}
                helperText={formErrors.hubungan_dgn_pemilik_no_hp_darurat}
              />
            ) : (
            <Typography variant="body2">{employee?.hubungan_dgn_pemilik_no_hp_darurat || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('hubungan_dgn_pemilik_no_hp_darurat')}
              color={editableFields.hubungan_dgn_pemilik_no_hp_darurat ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
        
        {/* Address Information */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3" fontWeight="bold">
          Domisili
        </Typography>
          {Object.keys(editableFields).some(key => ['kota', 'kecamatan', 'kelurahan', 'alamat'].includes(key)) ? (
            <Button 
              variant="contained" 
              color="primary" 
              size="small"
              startIcon={<Save />}
              onClick={() => handleSave()}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          ) : null}
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Kota/Kabupaten</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.kota ? (
              <TextField
                fullWidth
                size="small"
                name="kota"
                value={formData.kota || ''}
                onChange={handleChange}
                error={!!formErrors.kota}
                helperText={formErrors.kota}
              />
            ) : (
            <Typography variant="body2">{employee?.kota || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('kota')}
              color={editableFields.kota ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Kecamatan</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.kecamatan ? (
              <TextField
                fullWidth
                size="small"
                name="kecamatan"
                value={formData.kecamatan || ''}
                onChange={handleChange}
                error={!!formErrors.kecamatan}
                helperText={formErrors.kecamatan}
              />
            ) : (
            <Typography variant="body2">{employee?.kecamatan || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('kecamatan')}
              color={editableFields.kecamatan ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Kelurahan</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.kelurahan ? (
              <TextField
                fullWidth
                size="small"
                name="kelurahan"
                value={formData.kelurahan || ''}
                onChange={handleChange}
                error={!!formErrors.kelurahan}
                helperText={formErrors.kelurahan}
              />
            ) : (
            <Typography variant="body2">{employee?.kelurahan || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('kelurahan')}
              color={editableFields.kelurahan ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Detail Alamat</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.alamat ? (
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                name="alamat"
                value={formData.alamat || ''}
                onChange={handleChange}
                error={!!formErrors.alamat}
                helperText={formErrors.alamat}
              />
            ) : (
            <Typography variant="body2">{employee?.alamat || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('alamat')}
              color={editableFields.alamat ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
        
        {/* Job Information with new fields */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3" fontWeight="bold">
          Informasi Pekerjaan
        </Typography>
          {Object.keys(editableFields).some(key => ['posisi_dilamar', 'divisi', 'tanggal_bergabung', 'tanggal_berakhir_kontrak', 'status_kerja'].includes(key)) ? (
            <Button 
              variant="contained" 
              color="primary" 
              size="small"
              startIcon={<Save />}
              onClick={() => handleSave()}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          ) : null}
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Posisi</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.posisi_dilamar ? (
              <TextField
                fullWidth
                size="small"
                name="posisi_dilamar"
                value={formData.posisi_dilamar || employee?.jobPostingId?.jobPosition || ''}
                onChange={handleChange}
                error={!!formErrors.posisi_dilamar}
                helperText={formErrors.posisi_dilamar}
              />
            ) : (
            <Typography variant="body2">{employee?.posisi_dilamar || employee?.jobPostingId?.jobPosition || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('posisi_dilamar')}
              color={editableFields.posisi_dilamar ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Divisi</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.divisi ? (
              <TextField
                fullWidth
                size="small"
                name="divisi"
                value={formData.divisi || ''}
                onChange={handleChange}
                error={!!formErrors.divisi}
                helperText={formErrors.divisi}
              />
            ) : (
              <Typography variant="body2">{formData?.divisi || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('divisi')}
              color={editableFields.divisi ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Lokasi Penempatan</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.lokasi_penempatan ? (
              <TextField
                fullWidth
                size="small"
                name="lokasi_penempatan"
                value={formData.lokasi_penempatan || employee?.jobPostingId?.location || employee?.kota || ''}
                onChange={handleChange}
                error={!!formErrors.lokasi_penempatan}
                helperText={formErrors.lokasi_penempatan}
              />
            ) : (
            <Typography variant="body2">{employee?.jobPostingId?.location || employee?.kota || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('lokasi_penempatan')}
              color={editableFields.lokasi_penempatan ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Tanggal Bergabung</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.tanggal_bergabung ? (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={formData.tanggal_bergabung ? new Date(formData.tanggal_bergabung) : null}
                  onChange={(date) => handleDateChange('tanggal_bergabung', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      error={!!formErrors.tanggal_bergabung}
                      helperText={formErrors.tanggal_bergabung}
                    />
                  )}
                />
              </LocalizationProvider>
            ) : (
              <Typography variant="body2">{formatDate(formData?.tanggal_bergabung || employee?.updatedAt || employee?.submissionDate)}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('tanggal_bergabung')}
              color={editableFields.tanggal_bergabung ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Tanggal Berakhir Kontrak</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.tanggal_berakhir_kontrak ? (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={formData.tanggal_berakhir_kontrak ? new Date(formData.tanggal_berakhir_kontrak) : null}
                  onChange={(date) => handleDateChange('tanggal_berakhir_kontrak', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      error={!!formErrors.tanggal_berakhir_kontrak}
                      helperText={formErrors.tanggal_berakhir_kontrak}
                    />
                  )}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            ) : (
              <Typography variant="body2">{formatDate(formData?.tanggal_berakhir_kontrak) || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('tanggal_berakhir_kontrak')}
              color={editableFields.tanggal_berakhir_kontrak ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Status Kerja</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.status_kerja ? (
              <FormControl fullWidth size="small">
                <Select
                  name="status_kerja"
                  value={formData.status_kerja ? true : false}
                  onChange={(e) => setFormData({...formData, status_kerja: e.target.value})}
                >
                  <MenuItem value={true}>Aktif</MenuItem>
                  <MenuItem value={false}>Tidak Aktif</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <Typography variant="body2">{formData?.status_kerja ? 'Aktif' : 'Tidak Aktif'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('status_kerja')}
              color={editableFields.status_kerja ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
        
        {/* Vehicle Information */}
        {employee && (employee.tipe_sim !== 'Tidak Punya' || employee.no_sim) && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h3" fontWeight="bold">
              Informasi Kendaraan
            </Typography>
              {Object.keys(editableFields).some(key => ['tipe_sim', 'no_sim', 'masa_berlaku_sim', 'merk_kendaraan', 'no_pol_kendaraan', 'no_stnk', 'masa_berlaku_stnk', 'masa_berlaku_pajak_kendaraan'].includes(key)) ? (
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="small"
                  startIcon={<Save />}
                  onClick={() => handleSave()}
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              ) : null}
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4} sm={3} md={2}>
                <Typography variant="body2" color="text.secondary">Tipe SIM</Typography>
              </Grid>
              <Grid item xs={7} sm={8} md={9}>
                {editableFields.tipe_sim ? (
                  <FormControl fullWidth size="small" error={!!formErrors.tipe_sim}>
                    <Select
                      name="tipe_sim"
                      value={formData.tipe_sim || ''}
                      onChange={handleChange}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Pilih Tipe SIM</MenuItem>
                      <MenuItem value="Tidak Punya">Tidak Punya</MenuItem>
                      <MenuItem value="SIM A">SIM A</MenuItem>
                      <MenuItem value="SIM B1">SIM B1</MenuItem>
                      <MenuItem value="SIM B2">SIM B2</MenuItem>
                      <MenuItem value="SIM C">SIM C</MenuItem>
                    </Select>
                    {formErrors.tipe_sim && <FormHelperText>{formErrors.tipe_sim}</FormHelperText>}
                  </FormControl>
                ) : (
                <Typography variant="body2">{employee?.tipe_sim || '-'}</Typography>
                )}
              </Grid>
              <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
                <IconButton 
                  size="small" 
                  onClick={() => toggleEditMode('tipe_sim')}
                  color={editableFields.tipe_sim ? 'primary' : 'default'}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Grid>
              
              <Grid item xs={4} sm={3} md={2}>
                <Typography variant="body2" color="text.secondary">No SIM</Typography>
              </Grid>
              <Grid item xs={7} sm={8} md={9}>
                {editableFields.no_sim ? (
                  <TextField
                    fullWidth
                    size="small"
                    name="no_sim"
                    value={formData.no_sim || ''}
                    onChange={handleChange}
                    error={!!formErrors.no_sim}
                    helperText={formErrors.no_sim}
                    disabled={formData.tipe_sim === 'Tidak Punya'}
                  />
                ) : (
                <Typography variant="body2">{employee?.no_sim || '-'}</Typography>
                )}
              </Grid>
              <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
                <IconButton 
                  size="small" 
                  onClick={() => toggleEditMode('no_sim')}
                  color={editableFields.no_sim ? 'primary' : 'default'}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Grid>
              
              <Grid item xs={4} sm={3} md={2}>
                <Typography variant="body2" color="text.secondary">Masa Berlaku SIM</Typography>
              </Grid>
              <Grid item xs={7} sm={8} md={9}>
                {editableFields.masa_berlaku_sim ? (
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      value={formData.masa_berlaku_sim ? new Date(formData.masa_berlaku_sim) : null}
                      onChange={(date) => handleDateChange('masa_berlaku_sim', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          size="small"
                          error={!!formErrors.masa_berlaku_sim}
                          helperText={formErrors.masa_berlaku_sim}
                        />
                      )}
                      disabled={formData.tipe_sim === 'Tidak Punya'}
                      minDate={new Date()}
                    />
                  </LocalizationProvider>
                ) : (
                <Typography variant="body2">{formatDate(employee?.masa_berlaku_sim)}</Typography>
                )}
              </Grid>
              <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
                <IconButton 
                  size="small" 
                  onClick={() => toggleEditMode('masa_berlaku_sim')}
                  color={editableFields.masa_berlaku_sim ? 'primary' : 'default'}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Grid>
              
              <Grid item xs={4} sm={3} md={2}>
                <Typography variant="body2" color="text.secondary">Jenis & Merk Kendaraan</Typography>
              </Grid>
              <Grid item xs={7} sm={8} md={9}>
                {editableFields.merk_kendaraan ? (
                  <TextField
                    fullWidth
                    size="small"
                    name="merk_kendaraan"
                    value={formData.merk_kendaraan || ''}
                    onChange={handleChange}
                    error={!!formErrors.merk_kendaraan}
                    helperText={formErrors.merk_kendaraan}
                    disabled={formData.tipe_sim === 'Tidak Punya'}
                  />
                ) : (
                <Typography variant="body2">{employee?.merk_kendaraan || '-'}</Typography>
                )}
              </Grid>
              <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
                <IconButton 
                  size="small" 
                  onClick={() => toggleEditMode('merk_kendaraan')}
                  color={editableFields.merk_kendaraan ? 'primary' : 'default'}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Grid>
              
              <Grid item xs={4} sm={3} md={2}>
                <Typography variant="body2" color="text.secondary">Nomor Polisi</Typography>
              </Grid>
              <Grid item xs={7} sm={8} md={9}>
                {editableFields.no_pol_kendaraan ? (
                  <TextField
                    fullWidth
                    size="small"
                    name="no_pol_kendaraan"
                    value={formData.no_pol_kendaraan || ''}
                    onChange={handleChange}
                    error={!!formErrors.no_pol_kendaraan}
                    helperText={formErrors.no_pol_kendaraan}
                    disabled={formData.tipe_sim === 'Tidak Punya'}
                  />
                ) : (
                <Typography variant="body2">{employee?.no_pol_kendaraan || '-'}</Typography>
                )}
              </Grid>
              <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
                <IconButton 
                  size="small" 
                  onClick={() => toggleEditMode('no_pol_kendaraan')}
                  color={editableFields.no_pol_kendaraan ? 'primary' : 'default'}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Grid>
              
              <Grid item xs={4} sm={3} md={2}>
                <Typography variant="body2" color="text.secondary">Nomor STNK</Typography>
              </Grid>
              <Grid item xs={7} sm={8} md={9}>
                {editableFields.no_stnk ? (
                  <TextField
                    fullWidth
                    size="small"
                    name="no_stnk"
                    value={formData.no_stnk || ''}
                    onChange={handleChange}
                    error={!!formErrors.no_stnk}
                    helperText={formErrors.no_stnk}
                    disabled={formData.tipe_sim === 'Tidak Punya'}
                  />
                ) : (
                <Typography variant="body2">{employee?.no_stnk || '-'}</Typography>
                )}
              </Grid>
              <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
                <IconButton 
                  size="small" 
                  onClick={() => toggleEditMode('no_stnk')}
                  color={editableFields.no_stnk ? 'primary' : 'default'}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Grid>
              
              <Grid item xs={4} sm={3} md={2}>
                <Typography variant="body2" color="text.secondary">Masa Berlaku STNK</Typography>
              </Grid>
              <Grid item xs={7} sm={8} md={9}>
                {editableFields.masa_berlaku_stnk ? (
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      value={formData.masa_berlaku_stnk ? new Date(formData.masa_berlaku_stnk) : null}
                      onChange={(date) => handleDateChange('masa_berlaku_stnk', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          size="small"
                          error={!!formErrors.masa_berlaku_stnk}
                          helperText={formErrors.masa_berlaku_stnk}
                        />
                      )}
                      disabled={formData.tipe_sim === 'Tidak Punya'}
                      minDate={new Date()}
                    />
                  </LocalizationProvider>
                ) : (
                <Typography variant="body2">{formatDate(employee?.masa_berlaku_stnk)}</Typography>
                )}
              </Grid>
              <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
                <IconButton 
                  size="small" 
                  onClick={() => toggleEditMode('masa_berlaku_stnk')}
                  color={editableFields.masa_berlaku_stnk ? 'primary' : 'default'}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Grid>
              
              <Grid item xs={4} sm={3} md={2}>
                <Typography variant="body2" color="text.secondary">Masa Berlaku Pajak</Typography>
              </Grid>
              <Grid item xs={7} sm={8} md={9}>
                {editableFields.masa_berlaku_pajak_kendaraan ? (
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      value={formData.masa_berlaku_pajak_kendaraan ? new Date(formData.masa_berlaku_pajak_kendaraan) : null}
                      onChange={(date) => handleDateChange('masa_berlaku_pajak_kendaraan', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          size="small"
                          error={!!formErrors.masa_berlaku_pajak_kendaraan}
                          helperText={formErrors.masa_berlaku_pajak_kendaraan}
                        />
                      )}
                      disabled={formData.tipe_sim === 'Tidak Punya'}
                      minDate={new Date()}
                    />
                  </LocalizationProvider>
                ) : (
                <Typography variant="body2">{formatDate(employee?.masa_berlaku_pajak_kendaraan)}</Typography>
                )}
              </Grid>
              <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
                <IconButton 
                  size="small" 
                  onClick={() => toggleEditMode('masa_berlaku_pajak_kendaraan')}
                  color={editableFields.masa_berlaku_pajak_kendaraan ? 'primary' : 'default'}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>
          </>
        )}
        
        {/* Bank Information */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3" fontWeight="bold">
          Informasi Rekening Bank
        </Typography>
          {Object.keys(editableFields).some(key => ['no_rekening', 'nama_pemilik_rekening', 'nama_bank'].includes(key)) ? (
            <Button 
              variant="contained" 
              color="primary" 
              size="small"
              startIcon={<Save />}
              onClick={() => handleSave()}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          ) : null}
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">No. Rekening</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.no_rekening ? (
              <TextField
                fullWidth
                size="small"
                name="no_rekening"
                value={formData.no_rekening || ''}
                onChange={handleChange}
                error={!!formErrors.no_rekening}
                helperText={formErrors.no_rekening}
              />
            ) : (
            <Typography variant="body2">{employee?.no_rekening || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('no_rekening')}
              color={editableFields.no_rekening ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Nama Pemilik Rekening</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.nama_pemilik_rekening ? (
              <TextField
                fullWidth
                size="small"
                name="nama_pemilik_rekening"
                value={formData.nama_pemilik_rekening || ''}
                onChange={handleChange}
                error={!!formErrors.nama_pemilik_rekening}
                helperText={formErrors.nama_pemilik_rekening}
              />
            ) : (
            <Typography variant="body2">{employee?.nama_pemilik_rekening || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('nama_pemilik_rekening')}
              color={editableFields.nama_pemilik_rekening ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
          
          <Grid item xs={4} sm={3} md={2}>
            <Typography variant="body2" color="text.secondary">Nama Bank</Typography>
          </Grid>
          <Grid item xs={7} sm={8} md={9}>
            {editableFields.nama_bank ? (
              <TextField
                fullWidth
                size="small"
                name="nama_bank"
                value={formData.nama_bank || ''}
                onChange={handleChange}
                error={!!formErrors.nama_bank}
                helperText={formErrors.nama_bank}
              />
            ) : (
            <Typography variant="body2">{employee?.nama_bank || '-'}</Typography>
            )}
          </Grid>
          <Grid item xs={1} sm={1} md={1} sx={{ textAlign: 'right' }}>
            <IconButton 
              size="small" 
              onClick={() => toggleEditMode('nama_bank')}
              color={editableFields.nama_bank ? 'primary' : 'default'}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
        
        {/* Documents */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3" fontWeight="bold">
          Dokumen
        </Typography>
          {Object.keys(editableFields).some(key => ['foto_diri', 'foto_ktp', 'foto_ijazah', 'foto_sim', 'foto_stnk_hal_1', 'foto_stnk_hal_2'].includes(key)) ? (
            <Button 
              variant="contained" 
              color="primary" 
              size="small"
              startIcon={<Save />}
              onClick={() => handleSave()}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          ) : null}
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 1,
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <PictureAsPdf color="error" />
                <Typography sx={{ flexGrow: 1 }}>Foto Diri</Typography>
              {editableFields.foto_diri ? (
                <Button
                  component="label"
                  variant="contained"
                  size="small"
                  sx={{ marginRight: 1 }}
                >
                  Upload
                  <input
                    type="file"
                    hidden
                    name="foto_diri"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 4 }}
                  onClick={() => handleViewDocument(employee.foto_diri)}
                    disabled={!employee.foto_diri}
                >
                  Lihat
                </Button>
                  <IconButton 
                    size="small" 
                    onClick={() => toggleEditMode('foto_diri')}
                    color={editableFields.foto_diri ? 'primary' : 'default'}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
              </Box>
              )}
            </Box>
            {formErrors.foto_diri && (
              <FormHelperText error>{formErrors.foto_diri}</FormHelperText>
          )}
            {documentPreviews.foto_diri && (
              <Box 
                sx={{ 
                  mt: 1, 
                  p: 1, 
                  border: '1px solid #ddd', 
                  borderRadius: 1,
                  height: '100px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}
              >
                <img 
                  src={documentPreviews.foto_diri} 
                  alt="Preview Foto Diri" 
                  style={{ maxHeight: '100%', maxWidth: '100%' }} 
                />
              </Box>
            )}
          </Grid>
          
            <Grid item xs={12} sm={6} md={4}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 1,
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <PictureAsPdf color="error" />
                <Typography sx={{ flexGrow: 1 }}>Foto KTP</Typography>
              {editableFields.foto_ktp ? (
                <Button
                  component="label"
                  variant="contained"
                  size="small"
                  sx={{ marginRight: 1 }}
                >
                  Upload
                  <input
                    type="file"
                    hidden
                    name="foto_ktp"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 4 }}
                  onClick={() => handleViewDocument(employee.foto_ktp)}
                    disabled={!employee.foto_ktp}
                >
                  Lihat
                </Button>
                  <IconButton 
                    size="small" 
                    onClick={() => toggleEditMode('foto_ktp')}
                    color={editableFields.foto_ktp ? 'primary' : 'default'}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
              </Box>
              )}
            </Box>
            {formErrors.foto_ktp && (
              <FormHelperText error>{formErrors.foto_ktp}</FormHelperText>
          )}
            {documentPreviews.foto_ktp && (
              <Box 
                sx={{ 
                  mt: 1, 
                  p: 1, 
                  border: '1px solid #ddd', 
                  borderRadius: 1,
                  height: '100px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}
              >
                <img 
                  src={documentPreviews.foto_ktp} 
                  alt="Preview Foto KTP" 
                  style={{ maxHeight: '100%', maxWidth: '100%' }} 
                />
              </Box>
            )}
          </Grid>
          
            <Grid item xs={12} sm={6} md={4}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 1,
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <PictureAsPdf color="error" />
                <Typography sx={{ flexGrow: 1 }}>Foto Ijazah</Typography>
              {editableFields.foto_ijazah ? (
                <Button
                  component="label"
                  variant="contained"
                  size="small"
                  sx={{ marginRight: 1 }}
                >
                  Upload
                  <input
                    type="file"
                    hidden
                    name="foto_ijazah"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 4 }}
                  onClick={() => handleViewDocument(employee.foto_ijazah)}
                    disabled={!employee.foto_ijazah}
                >
                  Lihat
                </Button>
                  <IconButton 
                    size="small" 
                    onClick={() => toggleEditMode('foto_ijazah')}
                    color={editableFields.foto_ijazah ? 'primary' : 'default'}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
              </Box>
              )}
            </Box>
            {formErrors.foto_ijazah && (
              <FormHelperText error>{formErrors.foto_ijazah}</FormHelperText>
          )}
            {documentPreviews.foto_ijazah && (
              <Box 
                sx={{ 
                  mt: 1, 
                  p: 1, 
                  border: '1px solid #ddd', 
                  borderRadius: 1,
                  height: '100px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}
              >
                <img 
                  src={documentPreviews.foto_ijazah} 
                  alt="Preview Foto Ijazah" 
                  style={{ maxHeight: '100%', maxWidth: '100%' }} 
                />
              </Box>
            )}
          </Grid>
          
          {employee && (employee.tipe_sim !== 'Tidak Punya' || employee.no_sim) && (
            <>
            <Grid item xs={12} sm={6} md={4}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 1,
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <PictureAsPdf color="error" />
                <Typography sx={{ flexGrow: 1 }}>Foto SIM</Typography>
                  {editableFields.foto_sim ? (
                    <Button
                      component="label"
                      variant="contained"
                      size="small"
                      sx={{ marginRight: 1 }}
                    >
                      Upload
                      <input
                        type="file"
                        hidden
                        name="foto_sim"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 4 }}
                  onClick={() => handleViewDocument(employee.foto_sim)}
                        disabled={!employee.foto_sim}
                >
                  Lihat
                </Button>
                      <IconButton 
                        size="small" 
                        onClick={() => toggleEditMode('foto_sim')}
                        color={editableFields.foto_sim ? 'primary' : 'default'}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
              </Box>
                  )}
                </Box>
                {formErrors.foto_sim && (
                  <FormHelperText error>{formErrors.foto_sim}</FormHelperText>
          )}
                {documentPreviews.foto_sim && (
                  <Box 
                    sx={{ 
                      mt: 1, 
                      p: 1, 
                      border: '1px solid #ddd', 
                      borderRadius: 1,
                      height: '100px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <img 
                      src={documentPreviews.foto_sim} 
                      alt="Preview Foto SIM" 
                      style={{ maxHeight: '100%', maxWidth: '100%' }} 
                    />
                  </Box>
                )}
              </Grid>
              
            <Grid item xs={12} sm={6} md={4}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 1,
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <PictureAsPdf color="error" />
                <Typography sx={{ flexGrow: 1 }}>Foto STNK (Halaman 1)</Typography>
                  {editableFields.foto_stnk_hal_1 ? (
                    <Button
                      component="label"
                      variant="contained"
                      size="small"
                      sx={{ marginRight: 1 }}
                    >
                      Upload
                      <input
                        type="file"
                        hidden
                        name="foto_stnk_hal_1"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 4 }}
                  onClick={() => handleViewDocument(employee.foto_stnk_hal_1)}
                        disabled={!employee.foto_stnk_hal_1}
                >
                  Lihat
                </Button>
                      <IconButton 
                        size="small" 
                        onClick={() => toggleEditMode('foto_stnk_hal_1')}
                        color={editableFields.foto_stnk_hal_1 ? 'primary' : 'default'}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
              </Box>
                  )}
                </Box>
                {formErrors.foto_stnk_hal_1 && (
                  <FormHelperText error>{formErrors.foto_stnk_hal_1}</FormHelperText>
          )}
                {documentPreviews.foto_stnk_hal_1 && (
                  <Box 
                    sx={{ 
                      mt: 1, 
                      p: 1, 
                      border: '1px solid #ddd', 
                      borderRadius: 1,
                      height: '100px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <img 
                      src={documentPreviews.foto_stnk_hal_1} 
                      alt="Preview Foto STNK Halaman 1" 
                      style={{ maxHeight: '100%', maxWidth: '100%' }} 
                    />
                  </Box>
                )}
              </Grid>
              
            <Grid item xs={12} sm={6} md={4}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 1,
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                <PictureAsPdf color="error" />
                <Typography sx={{ flexGrow: 1 }}>Foto STNK (Halaman 2)</Typography>
                  {editableFields.foto_stnk_hal_2 ? (
                    <Button
                      component="label"
                      variant="contained"
                      size="small"
                      sx={{ marginRight: 1 }}
                    >
                      Upload
                      <input
                        type="file"
                        hidden
                        name="foto_stnk_hal_2"
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 4 }}
                  onClick={() => handleViewDocument(employee.foto_stnk_hal_2)}
                        disabled={!employee.foto_stnk_hal_2}
                >
                  Lihat
                </Button>
                      <IconButton 
                        size="small" 
                        onClick={() => toggleEditMode('foto_stnk_hal_2')}
                        color={editableFields.foto_stnk_hal_2 ? 'primary' : 'default'}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
              </Box>
                  )}
                </Box>
                {formErrors.foto_stnk_hal_2 && (
                  <FormHelperText error>{formErrors.foto_stnk_hal_2}</FormHelperText>
                )}
                {documentPreviews.foto_stnk_hal_2 && (
                  <Box 
                    sx={{ 
                      mt: 1, 
                      p: 1, 
                      border: '1px solid #ddd', 
                      borderRadius: 1,
                      height: '100px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <img 
                      src={documentPreviews.foto_stnk_hal_2} 
                      alt="Preview Foto STNK Halaman 2" 
                      style={{ maxHeight: '100%', maxWidth: '100%' }} 
                    />
                  </Box>
                )}
            </Grid>
            </>
          )}
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {Object.keys(editableFields).length > 0 ? (
            <>
              <Button 
                variant="outlined" 
                onClick={() => setEditableFields({})}
              >
                Batal
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
              </Button>
            </>
          ) : (
          <Button 
            variant="contained" 
            onClick={handleBack}
          >
            Kembali
          </Button>
          )}
        </Box>
      </Paper>
      
      {/* Document Preview Modal with Zoom */}
      <Modal
        open={!!previewImage}
        onClose={handleClosePreview}
        aria-labelledby="document-preview"
        aria-describedby="preview of uploaded document"
      >
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '90%',
          maxWidth: '1200px',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 2,
          borderRadius: 2,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Preview Dokumen</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
              >
                -
              </Button>
              <Button 
                variant="outlined"
                size="small"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
              >
                +
              </Button>
              <Button 
                variant="outlined"
                size="small"
                onClick={handleZoomToggle}
              >
                {zoomed ? 'Reset Zoom' : 'Zoom In'}
              </Button>
              <IconButton onClick={handleClosePreview}>
                <Close />
              </IconButton>
            </Box>
          </Box>
          <Box 
            sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              textAlign: 'center',
              cursor: zoomed ? 'zoom-out' : 'zoom-in'
            }}
            onClick={handleZoomToggle}
          >
            <img 
              src={previewImage} 
              alt="Document Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: zoomed ? 'none' : 'calc(90vh - 80px)',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center top',
                transition: 'transform 0.2s ease'
              }} 
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => window.open(previewImage, '_blank')}
            >
              Buka dalam Tab Baru
            </Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
};

export default KorlapEmployeeDetailPage; 