import dayjs from 'dayjs';

// Helper to format rows for DataGrid
export function formatRows(dataArray) {
  return dataArray.map((item, index) => ({
    id: index,
    keyword: item.keyword || '',
    searchVolume: item.search_volume ?? 0,
    cpc: item.cpc ?? 0,
    competition: item.competition || 'N/A',
    competitionIndex: item.competition_index ?? 0
  }));
}

// Helper: get date range by name
export function getDateRangeByLabel(label) {
  const today = dayjs();
  const yesterday = today.subtract(1, 'day');

  switch (label) {
    case '30d':
      return {
        from: yesterday.subtract(30, 'day'),
        to: yesterday
      };
    case 'ytd':
      return {
        from: dayjs().startOf('year'),
        to: yesterday
      };
    case '1y':
      return {
        from: yesterday.subtract(12, 'month'),
        to: yesterday
      };
    case '5y':
      return {
        from: yesterday.subtract(5, 'year'),
        to: yesterday
      };
    default:
      return {
        from: yesterday.subtract(12, 'month'),
        to: yesterday
      };
  }
}

// API helpers
export async function fetchCountries() {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/dataforseo/locations/countries`);
  const data = await res.json();
  return Array.isArray(data.countries) ? data.countries : [];
}

export async function fetchLanguages() {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/dataforseo/languages`);
  const data = await res.json();
  return data.tasks?.[0]?.result || [];
} 