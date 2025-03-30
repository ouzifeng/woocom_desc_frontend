// KeywordDataGrid.jsx
import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

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
  }
];

export default function KeywordDataGrid({ rows, loading }) {
  const [rowSelectionModel, setRowSelectionModel] = useState([]);

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        checkboxSelection
        disableRowSelectionOnClick
        disableColumnResize
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
          '& .even': { backgroundColor: '#fafafa' },
          '& .odd': { backgroundColor: '#ffffff' },
          '.MuiDataGrid-cell': {
            lineHeight: 'normal !important',
            display: 'flex',
            alignItems: 'center',
          },
          '.MuiDataGrid-row': {
            borderBottom: '1px solid #f0f0f0',
            cursor: 'pointer'
          },
          '.MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #ddd',
          },
          '& .MuiDataGrid-main': {
            border: 'none',
          },
          '& .MuiDataGrid-cell': {
            border: 'none',
          },
          '& .MuiDataGrid-columnHeader': {
            border: 'none',
          },
          '& .MuiDataGrid-footerContainer': {
            border: 'none',
          }
        }}
      />
    </Box>
  );
}
