import { FormEvent, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Button, FilePicker, Input, Textarea } from '@/components';
import { useAdventures } from '@/data/adventures';
import './AdventureForm.css';
import { CreateAdventureInput } from '@db/adventure';

type AdventureFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

type FormData = CreateAdventureInput & { imgFilePath: string };

const AdventureForm = ({ onSuccess, onCancel }: AdventureFormProps) => {
  const { createAdventure } = useAdventures();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    imgFilePath: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createAdventure(formData);
      setFormData({ title: '', description: '', imgFilePath: '' });
      onSuccess();
    } catch (error) {
      console.error('Failed to create adventure:', error);
    }
  };

  const updateFormData = (value: Partial<FormData>) => {
    setFormData({ ...formData, ...value });
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
            onChange={(e) => updateFormData({ title: e.target.value })}
            required
          />
          <Textarea
            placeholder='Description'
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={4}
          />
          <FilePicker
            onSelect={(e) => updateFormData({ imgFilePath: e })}
            fileType='image'
          />
          <div className='form-buttons'>
            <Button type='submit'>Create Adventure</Button>
            <Button type='button' variant='secondary' onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>

        <div>
          {formData.imgFilePath && (
            <img
              src={convertFileSrc(formData.imgFilePath)}
              alt='Adventure preview'
            />
          )}
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
