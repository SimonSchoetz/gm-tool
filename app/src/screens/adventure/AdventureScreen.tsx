import './AdventureScreen.css';
import { GlassPanel, Input, Textarea } from '@/components';
import { cn } from '@/util';
import { useParams } from '@tanstack/react-router';
import { UpdateAdventureFormData, useAdventures } from '@/data/adventures';
import { UploadAdventureImgBtn } from '@/components/AdventureComponents';
import { FormEvent, useEffect, useState } from 'react';
import { Adventure } from '@db/adventure';

export const AdventureScreen = () => {
  const { adventureId } = useParams({ from: '/adventures/$adventureId' });

  const { getAdventure } = useAdventures();

  const [formData, setFormData] = useState<UpdateAdventureFormData>({
    title: '',
    description: '',
  });

  useEffect(() => {
    const getFromDb = async () => {
      const adv = await getAdventure(adventureId);
      setFormData({
        title: adv.title,
        description: adv.description,
      });
    };
    getFromDb();
  }, []);

  const { updateAdventure } = useAdventures();

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
    <GlassPanel className={cn('adventure-screen')}>
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

        <UploadAdventureImgBtn adventureId={adventureId} />
      </form>
    </GlassPanel>
  );
};
