import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Nombre', style: { fontWeight: 600 } },
  { key: 'website', label: 'Sitio Web', render: (item) => item.website ? <a href={item.website} target="_blank" rel="noopener" style={{ color: 'var(--primary-600)' }}>{item.website}</a> : '—' },
  { key: 'status', label: 'Estado', render: (item) => <span className={`badge ${item.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{item.status === 'active' ? 'Activa' : 'Inactiva'}</span> },
];

const formFields = [
  { name: 'name', label: 'Nombre', required: true },
  { name: 'website', label: 'Sitio Web', placeholder: 'https://...' },
  { name: 'logo_url', label: 'URL del Logo', placeholder: 'https://...' },
];

export default function Brands() {
  return <CrudPage title="Marcas" endpoint="brands" columns={columns} formFields={formFields} />;
}
