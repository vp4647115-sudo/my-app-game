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
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...user,
      username: username.trim() || user.username,
      country: country.trim() || user.country,
      title: title.trim() || user.title,
      bio: bio.trim() || user.bio,
      avatarUrl: avatarUrl || user.avatarUrl,
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
          {/* Avatar Upload Field */}
          <div>
            <label className="block font-body text-xs font-bold text-[#D4AF37] mb-2 uppercase tracking-wider">
              Profile Picture / Avatar
            </label>
            <div className="flex items-center gap-4 bg-[#1e201d] p-3 rounded-xl border border-white/10">
              <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37]/50 shrink-0 bg-[#2a2d29] flex items-center justify-center overflow-hidden">
                {avatarUrl && !avatarUrl.includes('googleusercontent.com') && !avatarUrl.includes('unsplash.com') ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-[#D4AF37]">person</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="edit-modal-avatar-upload"
                  className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-[#b5952f] text-[#121411] font-body text-xs font-bold rounded-lg cursor-pointer transition-all inline-flex items-center gap-1.5 active:scale-95 shadow"
                >
                  <span className="material-symbols-outlined text-sm">upload</span>
                  <span>UPLOAD NEW PHOTO</span>
                  <input
                    id="edit-modal-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="font-body text-[10px] text-[#c4c7c7]/70 mt-1">
                  Supports PNG, JPG, or GIF images
                </p>
              </div>
            </div>
          </div>

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
