import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { useBrand } from '../contexts/BrandContext';

/**
 * TEMPLATE FOR BRAND-ISOLATED COMPONENTS
 * 
 * This template demonstrates the proper way to implement strict
 * brand isolation to guarantee that no data is shared between brands.
 * 
 * ALL components that fetch or store data should follow this pattern.
 */

const BrandIsolatedComponent = () => {
  // Authentication state
  const [user] = useAuthState(auth);
  
  // Brand context for brand isolation
  const { activeBrandId } = useBrand();
  
  // Component state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data for the CURRENT BRAND ONLY
  useEffect(() => {
    const fetchItems = async () => {
      if (!user?.uid || !activeBrandId) {
        // No user or no active brand - can't fetch data
        setItems([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching items for brand: ${activeBrandId}`);
        
        // CRITICAL: ALWAYS use this path pattern to guarantee brand isolation
        // users/{userId}/brands/{brandId}/collectionName
        const itemsRef = collection(
          db, 
          'users', 
          user.uid, 
          'brands', 
          activeBrandId, 
          'collectionName'
        );
        
        const itemsQuery = query(
          itemsRef,
          orderBy('created', 'desc'),
          // Additional filters as needed
          // where('someField', '==', someValue)
        );
        
        const snapshot = await getDocs(itemsQuery);
        const fetchedItems = [];
        
        snapshot.forEach(doc => {
          // ALWAYS include brandId in the data
          fetchedItems.push({
            id: doc.id,
            brandId: activeBrandId, // CRITICAL: Include brandId in all data
            ...doc.data()
          });
        });
        
        setItems(fetchedItems);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError('Failed to load items');
      } finally {
        setLoading(false);
      }
    };
    
    fetchItems();
    
    // CRITICAL: Listen for brand changes and reload data
    const handleBrandChanged = () => {
      console.log('Brand changed, clearing and reloading items');
      setItems([]); // Clear data from previous brand
      fetchItems(); // Fetch fresh data for new brand
    };
    
    window.addEventListener('brandChanged', handleBrandChanged);
    
    return () => {
      window.removeEventListener('brandChanged', handleBrandChanged);
    };
  }, [user, activeBrandId]); // Re-fetch when user or brand changes

  // Create a new item for the CURRENT BRAND ONLY
  const createItem = async (itemData) => {
    if (!user?.uid || !activeBrandId) {
      setError('Cannot create item: No active brand selected');
      return null;
    }
    
    try {
      // CRITICAL: ALWAYS use this path pattern to guarantee brand isolation
      const newItemRef = doc(collection(
        db, 
        'users', 
        user.uid, 
        'brands', 
        activeBrandId, 
        'collectionName'
      ));
      
      // CRITICAL: ALWAYS include brandId in the data
      const newItem = {
        ...itemData,
        brandId: activeBrandId, // Enforce brand isolation
        created: Timestamp.now()
      };
      
      await setDoc(newItemRef, newItem);
      
      // Add to local state
      const itemWithId = {
        id: newItemRef.id,
        ...newItem
      };
      
      setItems(prev => [itemWithId, ...prev]);
      
      return newItemRef.id;
    } catch (err) {
      console.error('Error creating item:', err);
      setError('Failed to create item');
      return null;
    }
  };

  // Update an item for the CURRENT BRAND ONLY
  const updateItem = async (itemId, itemData) => {
    if (!user?.uid || !activeBrandId) {
      setError('Cannot update item: No active brand selected');
      return false;
    }
    
    try {
      // CRITICAL: ALWAYS use this path pattern to guarantee brand isolation
      const itemRef = doc(
        db, 
        'users', 
        user.uid, 
        'brands', 
        activeBrandId, 
        'collectionName', 
        itemId
      );
      
      // CRITICAL: ALWAYS include brandId in the data
      const updatedData = {
        ...itemData,
        brandId: activeBrandId, // Enforce brand isolation
        updated: Timestamp.now()
      };
      
      await updateDoc(itemRef, updatedData);
      
      // Update local state
      setItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, ...updatedData } : item
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item');
      return false;
    }
  };

  // Delete an item from the CURRENT BRAND ONLY
  const deleteItem = async (itemId) => {
    if (!user?.uid || !activeBrandId) {
      setError('Cannot delete item: No active brand selected');
      return false;
    }
    
    try {
      // CRITICAL: ALWAYS use this path pattern to guarantee brand isolation
      const itemRef = doc(
        db, 
        'users', 
        user.uid, 
        'brands', 
        activeBrandId, 
        'collectionName', 
        itemId
      );
      
      await deleteDoc(itemRef);
      
      // Update local state
      setItems(prev => prev.filter(item => item.id !== itemId));
      
      return true;
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
      return false;
    }
  };

  // Example API request with brand isolation
  const fetchFromAPI = async () => {
    if (!user || !activeBrandId) {
      setError('Cannot fetch from API: No active brand selected');
      return null;
    }
    
    try {
      const token = await user.getIdToken();
      
      // CRITICAL: ALWAYS include brandId in API requests
      const response = await fetch('/api/endpoint', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Brand-Id': activeBrandId // Include brand ID in all API calls
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('API error:', err);
      setError('Failed to fetch from API');
      return null;
    }
  };

  // Component rendering
  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      
      {/* Render your items here */}
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.name} {/* Example field */}
            <button onClick={() => updateItem(item.id, { ...item, updated: true })}>
              Update
            </button>
            <button onClick={() => deleteItem(item.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      
      <button onClick={() => createItem({ name: 'New Item' })}>
        Create New Item
      </button>
    </div>
  );
};

export default BrandIsolatedComponent; 
 