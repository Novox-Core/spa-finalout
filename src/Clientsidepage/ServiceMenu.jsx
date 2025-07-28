import React, { useState, useMemo, useEffect } from "react";
import { Search, Filter, ArrowUpDown, MoreHorizontal, Plus, Edit, Trash2 } from "lucide-react";
import { Button, TextField, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, TextareaAutosize } from "@mui/material";
import { Base_url } from "../Service/Base_url";
import api from "../Service/Api";
import "./ServiceMenu.css";

const ServiceMenu = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [services, setServices] = useState([]);
  const [allServices, setAllServices] = useState([]); // NEW: store all services for category counts
  const [categories, setCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]); // NEW: for dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    duration: "",
    price: "",
    discountPrice: ""
  });
  const [success, setSuccess] = useState(null); // Add success state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: "",
    displayName: ""
  });

  // Fetch all services
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/services');

      if (response.data.success) {
        const services = response.data.data.services || [];
        console.log('🔍 Fetched services:', services.length);
        console.log('📝 Sample service category data:', services[0]?.category);
        
        setServices(services);
        setAllServices(services);
      } else {
        throw new Error(response.data.message || 'Failed to fetch services');
      }
    } catch (err) {
      console.error('❌ Failed to fetch services:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from the API
  const fetchAvailableCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setAvailableCategories(response.data.data.categories || []);
      }
    } catch (err) {
      console.error('❌ Failed to fetch available categories:', err);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      // Get all available categories
      const response = await api.get('/services/categories');

      if (response.data.success) {
        const categoryList = response.data.data.categories || [];
        console.log('📂 Fetched categories:', categoryList);
        console.log('🎯 All services for counting:', allServices.length);
        
        // Count services for each category using allServices
        const categoriesWithCounts = categoryList.map(category => {
          const count = allServices.filter(service => {
            const serviceCategoryId = service.category?._id;
            const serviceCategoryName = service.category?.displayName || service.category?.name;
            
            // Match by ID first, then by name as fallback
            return serviceCategoryId === category._id || 
                   serviceCategoryName === category.displayName ||
                   serviceCategoryName === category.name;
          }).length;

          console.log(`📊 Category "${category.displayName || category.name}": ${count} services`);
          console.log(`🔍 Category object:`, category); // Debug: log full category object

          return {
            _id: category._id, // Include the _id for deletion
            name: category.displayName || category.name,
            count: count
          };
        });

        const total = allServices.length;
        const finalCategories = [{ name: "All categories", count: total }, ...categoriesWithCounts];
        console.log('🎯 Final categories with IDs:', finalCategories); // Debug: log final categories
        setCategories(finalCategories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      // If fetching categories fails, at least show "All categories"
      setCategories([{ name: "All categories", count: allServices.length }]);
    }
  };

  // Search services
  const searchServices = async (query) => {
    if (!query.trim()) {
      fetchServices();
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);
      
      const response = await api.get(`/services/search?q=${encodeURIComponent(query)}`);

      if (response.data.success) {
        setServices(response.data.data.services || []);
      } else {
        throw new Error(response.data.message || 'Failed to search services');
      }
    } catch (err) {
      console.error('❌ Failed to search services:', err);
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Create new service
  const createService = async (serviceData) => {
    try {
      const response = await api.post('/services', serviceData);

      if (response.data.success) {
        setShowAddModal(false);
        setFormData({
          name: "",
          description: "",
          category: "",
          duration: "",
          price: "",
          discountPrice: ""
        });
        // Refresh all data to ensure populated categories
        await fetchServices();
        // Categories will be updated automatically via useEffect
        setSuccess('Service created successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to create service');
      }
    } catch (err) {
      console.error('❌ Failed to create service:', err);
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    }
  };

  // Update service
  const updateService = async (serviceId, serviceData) => {
    try {
      console.log('🔄 Attempting to update service:', { serviceId, serviceData });
      const response = await api.patch(`/services/${serviceId}`, serviceData);
      console.log('✅ Update service response:', response);

      if (response.data.success) {
        setShowEditModal(false);
        setSelectedService(null);
        setFormData({
          name: "",
          description: "",
          category: "",
          duration: "",
          price: "",
          discountPrice: ""
        });
        // Refresh all data to ensure populated categories
        await fetchServices();
        // Categories will be updated automatically via useEffect
        setSuccess('Service updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to update service');
      }
    } catch (err) {
      console.error('❌ Failed to update service:', err);
      console.error('❌ Update error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message);
      setTimeout(() => setError(null), 4000);
    }
  };

  // Create new category
  const createCategory = async (categoryData) => {
    try {
      const response = await api.post('/categories', categoryData);

      if (response.data.success) {
        setShowAddCategoryModal(false);
        setNewCategoryData({
          name: "",
          displayName: ""
        });
        // Refresh available categories and categories with counts
        await fetchAvailableCategories();
        await fetchCategories();
        setSuccess('Category created successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to create category');
      }
    } catch (err) {
      console.error('❌ Failed to create category:', err);
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    }
  };

  // Delete category
  const deleteCategory = async (categoryId, categoryName) => {
    console.log('🗑️ Delete category clicked:', { categoryId, categoryName });
    
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      console.log('❌ User cancelled category deletion');
      return;
    }

    try {
      console.log(`🔄 Attempting to delete category ID: ${categoryId}`);
      const response = await api.delete(`/categories/${categoryId}`);
      console.log('✅ Delete category response:', response);

      if (response.data.success) {
        console.log('✅ Category deleted successfully');
        // Refresh all data
        await fetchServices();
        await fetchAvailableCategories();
        await fetchCategories();
        setSuccess(response.data.message || 'Category deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
        
        // Reset to "All categories" if the deleted category was selected
        if (selectedCategory === categoryName) {
          setSelectedCategory("All categories");
        }
      } else {
        throw new Error(response.data.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('❌ Failed to delete category:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Show a user-friendly error if deletion is blocked due to active services
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message);
      }
      setTimeout(() => setError(null), 4000);
    }
  };

  // Delete service
  const deleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      console.log('🔄 Attempting to delete service:', serviceId);
      const response = await api.delete(`/services/${serviceId}`);
      console.log('✅ Delete service response:', response);

      if (response.data.success) {
        // Refresh all data
        await fetchServices();
        // Categories will be updated automatically via useEffect
        setSuccess(response.data.message || 'Service deleted or deactivated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to delete service');
      }
    } catch (err) {
      console.error('❌ Failed to delete service:', err);
      console.error('❌ Delete error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      // Show a user-friendly error if deletion is blocked due to active bookings
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message);
      }
      setTimeout(() => setError(null), 4000);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const serviceData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price),
      ...(formData.discountPrice && { discountPrice: parseFloat(formData.discountPrice) })
    };

    if (selectedService) {
      updateService(selectedService._id, serviceData);
    } else {
      createService(serviceData);
    }
  };

  // Handle category creation form submission
  const handleCategorySubmit = (e) => {
    e.preventDefault();
    createCategory(newCategoryData);
  };

  // Handle edit service
  const handleEditService = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category?._id || service.category, // Handle both old and new format
      duration: service.duration.toString(),
      price: service.price.toString(),
      discountPrice: service.discountPrice ? service.discountPrice.toString() : ""
    });
    setShowEditModal(true);
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchServices(searchTerm);
      } else {
        // If no search term, reset to show all services and then filter by category
        setServices(allServices);
        if (selectedCategory !== "All categories") {
          handleCategoryChange(selectedCategory);
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle category change - filter in memory
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category === "All categories") {
      setServices(allServices);
    } else {
      setServices(allServices.filter(service => {
        const serviceCategoryName = service.category?.displayName || service.category?.name;
        return serviceCategoryName === category;
      }));
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      await fetchServices(); // Wait for services to load first
      fetchAvailableCategories(); // Then fetch categories for dropdown
    };
    loadData();
  }, []);
  
  // Update categories when allServices change (after services are loaded)
  useEffect(() => {
    if (allServices.length > 0) { // Only fetch categories if we have services
      fetchCategories();
    }
  }, [allServices]);

  // Filter services based on search term and selected category
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // For category filtering, compare with service.category displayName
      const matchesCategory =
        selectedCategory === "All categories" ||
        (service.category?.displayName || service.category?.name) === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, services]);

  // Format duration from minutes to readable format
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  // Format price
  const formatPrice = (price) => {
    return `AED ${price}`;
  };

  if (loading) {
    return (
      <div className="service-menu">
        <div className="service-menu__loading">
          <CircularProgress />
          <p>Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="service-menu">
      {/* Header */}
      <div className="service-menu__header">
        <div className="service-menu__header-content">
          <div className="service-menu__title-section">
            <h1 className="service-menu__title">Service menu</h1>
            <p className="service-menu__subtitle">
              View and manage the services offered by your business.{" "}
              <span className="service-menu__learn-more">Learn more</span>
            </p>
          </div>
          <div className="service-menu__header-actions">
            <Button 
              variant="outlined" 
              className="service-menu__options-btn"
              onClick={() => setShowAddModal(true)}
              startIcon={<Plus size={16} />}
            >
              Add Service
            </Button>
            <Button 
              variant="outlined" 
              className="service-menu__add-category-btn"
              onClick={() => setShowAddCategoryModal(true)}
              startIcon={<Plus size={16} />}
            >
              Add Category
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} className="service-menu__error">
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} className="service-menu__success">
          {success}
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="service-menu__controls">
        <div className="service-menu__search-section">
            <div className="service-menu__search-wrapper">
              <Search className="service-menu__search-icon" size={20} />
              <input
                type="text"
                className="service-menu__search-input"
                placeholder="Search service name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            {searchLoading && <CircularProgress size={16} className="service-menu__search-loading" />}
          </div>
        </div>
        <div className="service-menu__manage-section"></div>
      </div>

      {/* Main Content */}
      <div className="service-menu__content">
        {/* Categories Sidebar */}
        <div className="service-menu__sidebar">
          <h3 className="service-menu__sidebar-title">Categories</h3>
          <div className="service-menu__categories">
            {categories.map((category, index) => (
              <div
                key={category.name}
                className={`service-menu__category-wrapper ${selectedCategory === category.name
                    ? "service-menu__category-wrapper--active"
                    : ""
                  }`}
              >
                <button
                  type="button"
                  className={`service-menu__category ${selectedCategory === category.name
                      ? "service-menu__category--active"
                      : ""
                    }`}
                  onClick={() => handleCategoryChange(category.name)}
                >
                  <span className="service-menu__category-name">
                    {category.name}
                  </span>
                  <span className="service-menu__category-count">
                    {category.count}
                  </span>
                </button>
                {/* Show delete button for all categories except "All categories" */}
                {category.name !== "All categories" && (
                  <button
                    className="service-menu__category-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent category selection when clicking delete
                      console.log('🖱️ Delete button clicked for category:', category);
                      deleteCategory(category._id, category.name);
                    }}
                    title={`Delete ${category.name} category`}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Services List */}
        <div className="service-menu__services">
          {services.map((service) => (
            <div key={service._id} className="service-menu__service-card">
              <div className="service-menu__service-header">
                <h3 className="service-menu__service-title">
                  {service.name}
                </h3>
                <div className="service-menu__service-actions">
                  <button 
                    className="service-menu__action-btn"
                    onClick={() => handleEditService(service)}
                    title="Edit service"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="service-menu__action-btn service-menu__action-btn--delete"
                    onClick={() => deleteService(service._id)}
                    title="Delete service"
                  >
                    <Trash2 size={16} />
                </button>
                </div>
              </div>

              <div className="service-menu__service-content">
                <div className="service-menu__service-info">
                  <h4 className="service-menu__service-name">{service.name}</h4>
                  <p className="service-menu__service-category">
                    Category: {service.category?.displayName || service.category?.name || 'Unknown'}
                    {/* Debug info */}
                    {process.env.NODE_ENV === 'development' && (
                      <span style={{fontSize: '10px', color: '#999', display: 'block'}}>
                         Name: {service.category?.name}
                      </span>
                    )}
                  </p>
                  <p className="service-menu__service-description">
                    {service.description}
                  </p>

                  <div className="service-menu__service-options">
                    <div className="service-menu__service-option">
                      <div className="service-menu__option-details">
                        <span className="service-menu__option-name">
                          {service.name}
                        </span>
                        <span className="service-menu__option-duration">
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                      <span className="service-menu__option-price">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                    {service.discountPrice && service.discountPrice < service.price && (
                      <div className="service-menu__service-option service-menu__service-option--discount">
                        <div className="service-menu__option-details">
                          <span className="service-menu__option-name">
                            {service.name} (Discounted)
                          </span>
                          <span className="service-menu__option-duration">
                            {formatDuration(service.duration)}
                          </span>
                        </div>
                        <span className="service-menu__option-price service-menu__option-price--discount">
                          {formatPrice(service.discountPrice)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {services.length === 0 && !loading && (
            <div className="service-menu__no-results">
              <p>No services found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Service Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Service</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} className="service-menu__form">
            <TextField
              fullWidth
              label="Service Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
              >
                {availableCategories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              required
              margin="normal"
              inputProps={{ min: 15, max: 480}}
            />
            <TextField
              fullWidth
              label="Price (AED)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              fullWidth
              label="Discount Price (AED) - Optional"
              type="number"
              value={formData.discountPrice}
              onChange={(e) => setFormData({...formData, discountPrice: e.target.value})}
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Add Service</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Service Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Service</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} className="service-menu__form">
            <TextField
              fullWidth
              label="Service Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
              >
                {availableCategories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              required
              margin="normal"
              inputProps={{ min: 15, max: 480}}
            />
            <TextField
              fullWidth
              label="Price (AED)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              fullWidth
              label="Discount Price (AED) - Optional"
              type="number"
              value={formData.discountPrice}
              onChange={(e) => setFormData({...formData, discountPrice: e.target.value})}
              margin="normal"
              inputProps={{ min: 0, step: 0.01 }}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Update Service</Button>
        </DialogActions>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={showAddCategoryModal} onClose={() => setShowAddCategoryModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <form onSubmit={handleCategorySubmit} className="service-menu__form">
            <TextField
              fullWidth
              label="Category Name (Internal)"
              value={newCategoryData.name}
              onChange={(e) => setNewCategoryData({...newCategoryData, name: e.target.value})}
              required
              margin="normal"
              helperText="Used for internal identification (e.g., 'facial-treatments')"
            />
            <TextField
              fullWidth
              label="Display Name"
              value={newCategoryData.displayName}
              onChange={(e) => setNewCategoryData({...newCategoryData, displayName: e.target.value})}
              required
              margin="normal"
              helperText="Name shown to users (e.g., 'Facial Treatments')"
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddCategoryModal(false)}>Cancel</Button>
          <Button onClick={handleCategorySubmit} variant="contained">Add Category</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ServiceMenu;
