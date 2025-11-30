import { FormEvent, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Button, Input, Textarea } from '@/components';
import { useAdventures } from '@/data/adventures';
import './AdventureForm.css';
import { CreateAdventureInput } from '@db/adventure';
import AdventureBtn from '../AdventureBtn/AdventureBtn';

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
          <div className='form-buttons'>
            <Button type='submit'>Create Adventure</Button>
            <Button type='button' variant='secondary' onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
        <div>
          <AdventureBtn
            onClick={(e) => updateFormData({ imgFilePath: e })}
            type='upload-img'
          >
            {formData.imgFilePath ? (
              <img
                src={convertFileSrc(formData.imgFilePath)}
                alt='Adventure preview'
              />
            ) : (
              <p
                style={{
                  textAlign: 'center',
                }}
              >
                Click to upload cover image or drag&drop
              </p>
            )}
          </AdventureBtn>
        </div>
      </div>
    </div>
  );
};

export default AdventureForm;
