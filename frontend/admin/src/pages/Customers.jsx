import CrudPage from '../components/CrudPage';

const columns = [
  { key: 'name', label: 'Nombre', style: { fontWeight: 600 } },
  { key: 'nit', label: 'NIT' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'type', label: 'Tipo', render: (item) => <span className={`badge ${item.type === 'corporate' ? 'badge-info' : 'badge-gray'}`}>{item.type === 'corporate' ? 'Corporativo' : 'Individual'}</span> },
  { key: 'contact_person', label: 'Contacto' },
];

const formFields = [
  { name: 'name', label: 'Nombre / Razón Social', required: true },
  { name: 'nit', label: 'NIT', required: true, placeholder: '1234567-8' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Teléfono', placeholder: '+502 0000-0000' },
  { name: 'address', label: 'Dirección' },
  { name: 'city', label: 'Ciudad', defaultValue: 'Guatemala' },
  { name: 'contact_person', label: 'Persona de Contacto' },
  { name: 'type', label: 'Tipo', type: 'select', options: [{ value: 'corporate', label: 'Corporativo' }, { value: 'individual', label: 'Individual' }], defaultValue: 'corporate' },
  { name: 'notes', label: 'Notas', type: 'textarea' },
];

export default function Customers() {
  return <CrudPage title="Clientes" endpoint="customers" columns={columns} formFields={formFields} />;
}
