import { FormEvent, useState } from 'react';
import { Button, Input, Textarea } from '@/components';
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
    <div className='adventure-form'>
      <h2 className='adventure-form-title'>Create Adventure</h2>
      <div className='body'>
        <form className='adventure-form-fields' onSubmit={handleSubmit}>
          <Input
            type='text'
            placeholder='Adventure Title *'
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
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

        <div>
          <p>
            The name of the adventure and a brief description. You will be able
            to start creating sessions in the next step.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdventureForm;
