import { FCProps } from '@/types';
import './AdventureScreen.css';
import { GlassPanel, Input, Textarea } from '@/components';
import { cn } from '@/util';
import { useParams } from '@tanstack/react-router';
import { UpdateAdventureFormData, useAdventures } from '@/data/adventures';
import { UploadAdventureImgBtn } from '@/components/AdventureComponents';
import { FormEvent, useState } from 'react';

type Props = object;

export const AdventureScreen: FCProps<Props> = ({ ...props }) => {
  const { adventureId } = useParams({ from: '/adventures/$adventureId' });

  const { getAdventure } = useAdventures();
  const adventure = getAdventure(adventureId);

  const { updateAdventure } = useAdventures();
  const [formData, setFormData] = useState<UpdateAdventureFormData>({
    title: adventure.title ?? '',
    description: adventure.description ?? '',
    imgFilePath: adventure.image_id ?? '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateAdventure(adventureId, formData);
      setFormData({ title: '', description: '', imgFilePath: '' });
      // onSuccess();
    } catch (error) {
      console.error('Failed to create adventure:', error);
    }
  };

  const updateFormData = (value: Partial<UpdateAdventureFormData>) => {
    setFormData({ ...formData, ...value });
  };

  return (
    <GlassPanel className={cn('adventure-screen')} {...props}>
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
        </div>

        <UploadAdventureImgBtn
          onClick={(filePath) => updateFormData({ imgFilePath: filePath })}
        />
      </form>
    </GlassPanel>
  );
};
