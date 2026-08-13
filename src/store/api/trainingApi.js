import { apiSlice } from "./apiSlice";

export const trainingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTrainings: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/training/trainings",
        params,
      }),
      providesTags: ["Trainings"],
    }),
    createTraining: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/training/trainings",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Trainings"],
    }),
    deleteTraining: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/training/trainings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Trainings"],
    }),
    getTrainingTypes: builder.query({
      query: (params = {}) => ({
        url: "/staff-hrms/recruitment/training-types",
        params,
      }),
      providesTags: ["TrainingTypes"],
    }),
    createTrainingType: builder.mutation({
      query: (data) => ({
        url: "/staff-hrms/recruitment/training-types",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["TrainingTypes"],
    }),
    updateTrainingType: builder.mutation({
      query: ({ id, data }) => ({
        url: `/staff-hrms/recruitment/training-types/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["TrainingTypes"],
    }),
    deleteTrainingType: builder.mutation({
      query: (id) => ({
        url: `/staff-hrms/recruitment/training-types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TrainingTypes"],
    }),
  }),
});

export const {
  useGetTrainingsQuery,
  useCreateTrainingMutation,
  useDeleteTrainingMutation,
  useGetTrainingTypesQuery,
  useCreateTrainingTypeMutation,
  useUpdateTrainingTypeMutation,
  useDeleteTrainingTypeMutation,
} = trainingApi;
