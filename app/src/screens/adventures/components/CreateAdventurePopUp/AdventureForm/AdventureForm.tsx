import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { Button, Input, Textarea } from '@/components';
import { useAdventures } from '@/data/adventures';
import './AdventureForm.css';
import { CreateAdventureInput } from '@db/adventure';
import { formObjectIsEmpty } from '@/util';
import { UploadAdventureImgBtn } from './UploadAdventureImgBtn/UploadAdventureImgBtn';

type AdventureFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
  setHasValues: Dispatch<SetStateAction<boolean>>;
};

type FormData = CreateAdventureInput & { imgFilePath: string };

const AdventureForm = ({
  onSuccess,
  onCancel,
  setHasValues,
}: AdventureFormProps) => {
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

  useEffect(() => {
    setHasValues(!formObjectIsEmpty(formData));
  }, [formData]);

  return (
    <div className='adventure-form-pop-up'>
      <h2>Create Adventure</h2>

      <form onSubmit={handleSubmit}>
        <div>
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
        </div>

        <UploadAdventureImgBtn
          onClick={(filePath) => updateFormData({ imgFilePath: filePath })}
        />
      </form>
    </div>
  );
};

export default AdventureForm;
