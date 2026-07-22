import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Nombre', style: { fontWeight: 600 } },
  { key: 'nit', label: 'NIT' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'contact_person', label: 'Contacto' },
];

const formFields = [
  { name: 'name', label: 'Nombre', required: true },
  { name: 'nit', label: 'NIT' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Teléfono' },
  { name: 'address', label: 'Dirección' },
  { name: 'contact_person', label: 'Persona de Contacto' },
  { name: 'notes', label: 'Notas', type: 'textarea' },
];

export default function Suppliers() {
  return <CrudPage title="Proveedores" endpoint="suppliers" columns={columns} formFields={formFields} />;
}
