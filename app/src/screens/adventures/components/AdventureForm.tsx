import { FormEvent } from 'react';
import { Button, Input, Textarea, GlassPanel } from '@/components';
import './AdventureForm.css';

type AdventureFormData = {
  title: string;
  description: string;
};

type AdventureFormProps = {
  formData: AdventureFormData;
  onSubmit: (e: FormEvent) => void;
  onChange: (formData: AdventureFormData) => void;
  onCancel: () => void;
};

const AdventureForm = ({
  formData,
  onSubmit,
  onChange,
  onCancel,
}: AdventureFormProps) => {
  return (
    <GlassPanel className='adventure-form'>
      <h2 className='adventure-form-title'>Create Adventure</h2>
      <form className='adventure-form-fields' onSubmit={onSubmit}>
        <Input
          type='text'
          placeholder='Adventure Title *'
          value={formData.title}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
          required
        />
        <Textarea
          placeholder='Description'
          value={formData.description}
          onChange={(e) =>
            onChange({ ...formData, description: e.target.value })
          }
          rows={4}
        />
        <div className='form-buttons'>
          <Button type='submit'>Create Adventure</Button>
          <Button type='button' variant='secondary' onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </GlassPanel>
  );
};

export default AdventureForm;
