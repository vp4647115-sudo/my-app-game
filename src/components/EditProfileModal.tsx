import React, { useState } from 'react';
import { UserProfile } from '../types';

interface EditProfileModalProps {
  user: UserProfile;
  onSave: (updated: UserProfile) => void;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onSave, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [country, setCountry] = useState(user.country);
  const [title, setTitle] = useState(user.title);
  const [bio, setBio] = useState(user.bio);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...user,
      username: username.trim() || user.username,
      country: country.trim() || user.country,
      title: title.trim() || user.title,
      bio: bio.trim() || user.bio,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121411]/85 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="glass-panel p-6 md:p-8 rounded-2xl max-w-md w-full border border-white/10 shadow-2xl space-y-6 text-[#e3e3de]">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h3 className="font-headline text-xl font-bold text-[#FAF9F6]">Edit Profile</h3>
          <button
            onClick={onClose}
            className="text-[#c4c7c7] hover:text-[#FAF9F6] p-1 rounded-full cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-body text-xs font-bold text-[#D4AF37] mb-1 uppercase tracking-wider">
              Profile Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1e201d] border border-white/10 rounded-lg px-4 py-2.5 font-body text-sm text-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block font-body text-xs font-bold text-[#D4AF37] mb-1 uppercase tracking-wider">
              Country / Region
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-[#1e201d] border border-white/10 rounded-lg px-4 py-2.5 font-body text-sm text-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block font-body text-xs font-bold text-[#D4AF37] mb-1 uppercase tracking-wider">
              Title Badge
            </label>
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1e201d] border border-white/10 rounded-lg px-4 py-2.5 font-body text-sm text-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="GM">Grandmaster (GM)</option>
              <option value="IM">International Master (IM)</option>
              <option value="FM">FIDE Master (FM)</option>
              <option value="Master">National Master</option>
              <option value="Candidate">Candidate Master</option>
            </select>
          </div>

          <div>
            <label className="block font-body text-xs font-bold text-[#D4AF37] mb-1 uppercase tracking-wider">
              Biography
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#1e201d] border border-white/10 rounded-lg px-4 py-2.5 font-body text-xs text-[#FAF9F6] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-white/10 font-body text-xs font-bold text-[#c4c7c7] hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg bg-[#FAF9F6] text-[#121411] font-body text-xs font-bold uppercase tracking-wider hover:bg-white cursor-pointer shadow"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
