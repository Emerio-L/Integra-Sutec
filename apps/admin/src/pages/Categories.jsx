import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Nombre', style: { fontWeight: 600 } },
  { key: 'slug', label: 'Slug' },
  { key: 'description', label: 'Descripción' },
  { key: 'status', label: 'Estado', render: (item) => <span className={`badge ${item.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{item.status === 'active' ? 'Activa' : 'Inactiva'}</span> },
];

const formFields = [
  { name: 'name', label: 'Nombre', required: true },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'icon', label: 'Ícono (emoji)', placeholder: '💻' },
];

export default function Categories() {
  return <CrudPage title="Categorías" endpoint="categories" columns={columns} formFields={formFields} />;
}
