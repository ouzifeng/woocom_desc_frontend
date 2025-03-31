// KeywordDataGrid.jsx
import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import IconButton from '@mui/material/IconButton';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';

export default function KeywordDataGrid({ 
  rows, 
  loading, 
  savedKeywords = [], // Add default value
  onSaveKeyword, 
  onRemoveKeyword 
}) {
  const [user] = useAuthState(auth);
  const [rowSelectionModel, setRowSelectionModel] = useState([]);

  // Move handleSaveToggle inside component
  const handleSaveToggle = async (keyword) => {
    if (!user) return;

    try {
      if (savedKeywords.some(k => k.keyword === keyword.keyword)) {
        // Remove from saved words
        await deleteDoc(
          doc(db, 'users', user.uid, 'savedKeywords', keyword.keyword)
        );
        onRemoveKeyword?.(keyword);
      } else {
        // Add to saved words
        await setDoc(
          doc(db, 'users', user.uid, 'savedKeywords', keyword.keyword),
          {
            ...keyword,
            savedAt: new Date().toISOString()
          }
        );
        onSaveKeyword?.(keyword);
      }
    } catch (error) {
      console.error('Error toggling saved keyword:', error);
    }
  };

  const columns = [
    {
      field: 'keyword',
      headerName: 'Keyword',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'searchVolume',
      headerName: 'Volume',
      width: 130,
      type: 'number'
    },
    {
      field: 'cpc',
      headerName: 'CPC ($)',
      width: 100,
      type: 'number'
    },
    {
      field: 'competition',
      headerName: 'Competition',
      width: 130
    },
    {
      field: 'competitionIndex',
      headerName: 'Comp. Index',
      width: 130,
      type: 'number'
    },
    {
      field: 'save',
      headerName: 'Save',
      width: 70,
      renderCell: (params) => {
        const isSaved = savedKeywords.some(k => k.keyword === params.row.keyword);
        return (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleSaveToggle(params.row);
            }}
          >
            {isSaved ? <RemoveIcon /> : <AddIcon />}
          </IconButton>
        );
      },
      headerAlign: 'center',
      align: 'center'
    }
  ];

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        checkboxSelection
        disableRowSelectionOnClick
        pageSizeOptions={[10, 20, 50]}
        paginationModel={{
          pageSize: 10,
          page: 0,
        }}
        rowHeight={70}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={(newSelection) => {
          const validSelection = newSelection.filter((id) =>
            rows.some((row) => row.id === id)
          );
          setRowSelectionModel(validSelection);
        }}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        sx={{
          flex: '1 1 0%',
          boxSizing: 'border-box',
          position: 'relative',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: 'var(--unstable_DataGrid-radius, 8px)',
          color: 'var(--template-palette-text-primary)',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          fontSize: '0.875rem',
          lineHeight: 1.43,
          outline: 'none',
          height: '100%',
          display: 'flex',
          minWidth: 0,
          minHeight: 0,
          flexDirection: 'column',
          overflowAnchor: 'none',
          '--DataGrid-overlayHeight': '300px',
          overflow: 'clip',
          borderColor: 'var(--template-palette-divider)',
          backgroundColor: 'var(--template-palette-background-default)',
          
          // Row and cell styling
          '& .even': { backgroundColor: '#fafafa' },
          '& .odd': { backgroundColor: '#ffffff' },
          '.MuiDataGrid-cell': {
            lineHeight: 'normal !important',
            display: 'flex',
            alignItems: 'center',
            border: 'none'
          },
          '.MuiDataGrid-row': {
            borderBottom: '1px solid var(--template-palette-TableCell-border)',
            cursor: 'pointer'
          },
          '.MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f6fa',
            borderBottom: '1px solid #ddd',
            minHeight: '56px !important',
            height: '56px !important',
            maxHeight: '56px !important'
          },
          '.MuiDataGrid-main': { border: 'none' },
          '.MuiDataGrid-columnHeader': { border: 'none' },
          '.MuiDataGrid-footerContainer': { border: 'none' },
          
          // DataGrid variables
          '--unstable_DataGrid-radius': '8px',
          '--unstable_DataGrid-headWeight': '500',
          '--unstable_DataGrid-overlayBackground': 'rgba(var(--template-palette-background-defaultChannel) / var(--template-palette-action-disabledOpacity))',
          '--DataGrid-containerBackground': 'var(--template-palette-background-default)',
          '--DataGrid-pinnedBackground': 'var(--template-palette-background-default)',
          '--DataGrid-rowBorderColor': 'var(--template-palette-TableCell-border)',
          '--DataGrid-cellOffsetMultiplier': '2',
          '--DataGrid-width': '0px',
          '--DataGrid-hasScrollX': '0',
          '--DataGrid-hasScrollY': '0',
          '--DataGrid-scrollbarSize': '10px',
          '--DataGrid-rowWidth': '0px',
          '--DataGrid-columnsTotalWidth': '0px',
          '--DataGrid-leftPinnedWidth': '0px',
          '--DataGrid-rightPinnedWidth': '0px',
          '--DataGrid-headerHeight': '56px',
          '--DataGrid-headersTotalHeight': '56px',
          '--DataGrid-topContainerHeight': '56px',
          '--DataGrid-bottomContainerHeight': '0px'
        }}
      />
    </Box>
  );
}
