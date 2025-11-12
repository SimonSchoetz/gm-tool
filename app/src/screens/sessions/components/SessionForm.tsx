import { FormEvent } from 'react';
import { Button, Input, Textarea, GlassPanel } from '@/components';
import './SessionForm.css';

type SessionFormData = {
  title: string;
  description: string;
  session_date: string;
  notes: string;
};

type SessionFormProps = {
  formData: SessionFormData;
  isEditing: boolean;
  onSubmit: (e: FormEvent) => void;
  onChange: (formData: SessionFormData) => void;
  onCancel: () => void;
};

const SessionForm = ({
  formData,
  isEditing,
  onSubmit,
  onChange,
  onCancel,
}: SessionFormProps) => {
  return (
    <GlassPanel className='session-form'>
      <form className='session-form-fields' onSubmit={onSubmit}>
        <Input
          type='text'
          placeholder='Session Title *'
          value={formData.title}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
          required
        />
        <Input
          type='text'
          placeholder='Description'
          value={formData.description}
          onChange={(e) =>
            onChange({ ...formData, description: e.target.value })
          }
        />
        <Input
          type='date'
          value={formData.session_date}
          onChange={(e) =>
            onChange({ ...formData, session_date: e.target.value })
          }
        />
        <Textarea
          placeholder='Session Notes'
          value={formData.notes}
          onChange={(e) => onChange({ ...formData, notes: e.target.value })}
          rows={4}
        />
        <div className='form-buttons'>
          <Button type='submit'>
            {isEditing ? 'Update' : 'Create'} Session
          </Button>
          {isEditing && (
            <Button type='button' variant='secondary' onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </GlassPanel>
  );
};

export default SessionForm;
