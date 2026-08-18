import { apiClient } from '../../../services/api/apiClient';
import { API_ENDPOINTS } from '../../../constants/api';
import { UserProfile, UpdateProfileDto } from '../types/profile.types';

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get<UserProfile>(API_ENDPOINTS.PROFILE.ME);
    return res.data;
  },

  updateProfile: async (dto: UpdateProfileDto): Promise<UserProfile> => {
    const res = await apiClient.put<UserProfile>(API_ENDPOINTS.PROFILE.UPDATE, dto);
    return res.data;
  },
};
