import { FormEvent, useState } from 'react';
import { Button, Input, Textarea, GlassPanel } from '@/components';
import { useAdventures } from '@/data/adventures';
import './AdventureForm.css';

type AdventureFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

const AdventureForm = ({ onSuccess, onCancel }: AdventureFormProps) => {
  const { createAdventure } = useAdventures();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createAdventure(formData);
      setFormData({ title: '', description: '' });
      onSuccess();
    } catch (error) {
      console.error('Failed to create adventure:', error);
    }
  };

  return (
    <GlassPanel className='adventure-form'>
      <h2 className='adventure-form-title'>Create Adventure</h2>
      <form className='adventure-form-fields' onSubmit={handleSubmit}>
        <Input
          type='text'
          placeholder='Adventure Title *'
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <Textarea
          placeholder='Description'
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
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
