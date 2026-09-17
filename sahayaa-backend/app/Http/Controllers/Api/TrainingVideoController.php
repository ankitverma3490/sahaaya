<?php

namespace App\Http\Controllers\Api;

use App\Models\TrainingVideo;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Controller;

class TrainingVideoController extends Controller
{
    /**
     * List all active training videos (for mobile app)
     */
    public function index(): JsonResponse
    {
        $videos = TrainingVideo::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        // Attach full URLs for uploaded files
        $videos->each(function ($video) {
            if ($video->video_file && !str_starts_with($video->video_file, 'http')) {
                $video->video_file_url = Storage::url('videos/' . $video->video_file);
            }
        });

        return response()->json([
            'status' => true,
            'data' => $videos,
        ]);
    }

    /**
     * List all training videos (for admin panel, including inactive)
     */
    public function adminIndex(): JsonResponse
    {
        $videos = TrainingVideo::orderBy('sort_order')
            ->orderBy('id')
            ->get();

        // Attach full URLs for uploaded files
        $videos->each(function ($video) {
            if ($video->video_file && !str_starts_with($video->video_file, 'http')) {
                $video->video_file_url = Storage::url('videos/' . $video->video_file);
            }
        });

        return response()->json([
            'status' => true,
            'data' => $videos,
        ]);
    }

    /**
     * Store a new training video
     */
    public function store(Request $request): JsonResponse
    {
        $validator = \Validator::make($request->all(), [
            'title'       => 'required|string|max:255',
            'subtitle'    => 'nullable|string|max:255',
            'video_url'   => 'nullable|url',
            'video_file'  => 'nullable|file|mimes:mp4,m4v,mov|mimetypes:video/mp4,video/quicktime,video/x-m4v,application/octet-stream|max:51200',
            'thumbnail'   => 'nullable|string|max:500',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'nullable',
        ]);

        // Must provide either video_url or video_file
        if (empty($request->video_url) && !$request->hasFile('video_file')) {
            return response()->json([
                'status'  => false,
                'message' => 'Please provide either a video URL or upload a video file',
            ], 422);
        }

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $data = [
            'title'      => $request->title,
            'subtitle'   => $request->subtitle,
            'video_url'  => $request->video_url,
            'thumbnail'  => $request->thumbnail,
            'sort_order' => $request->sort_order ?? 0,
            'is_active'  => filter_var($request->is_active ?? 'true', FILTER_VALIDATE_BOOLEAN),
        ];

        // Handle file upload
        if ($request->hasFile('video_file')) {
            $file = $request->file('video_file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->storeAs('videos', $filename, 'public');
            $data['video_file'] = $filename;
        }

        $video = TrainingVideo::create($data);

        return response()->json([
            'status'  => true,
            'message' => 'Training video added successfully',
            'data'    => $video,
        ], 201);
    }

    /**
     * Update a training video
     */
    public function update(Request $request, $id): JsonResponse
    {
        $video = TrainingVideo::find($id);

        if (!$video) {
            return response()->json([
                'status'  => false,
                'message' => 'Training video not found',
            ], 404);
        }

        $validator = \Validator::make($request->all(), [
            'title'       => 'sometimes|required|string|max:255',
            'subtitle'    => 'nullable|string|max:255',
            'video_url'   => 'nullable|url',
            'video_file'  => 'nullable|file|mimes:mp4,m4v,mov|mimetypes:video/mp4,video/quicktime,video/x-m4v,application/octet-stream|max:51200',
            'thumbnail'   => 'nullable|string|max:500',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $data = $validator->validated();

        // Cast is_active from string to boolean
        if (isset($data['is_active'])) {
            $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        // Handle file upload
        if ($request->hasFile('video_file')) {
            // Delete old file if exists
            if ($video->video_file) {
                Storage::disk('public')->delete('videos/' . $video->video_file);
            }

            $file = $request->file('video_file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->storeAs('videos', $filename, 'public');
            $data['video_file'] = $filename;

            // Clear video_url if uploading a new file
            if (isset($data['video_url'])) {
                $data['video_url'] = null;
            }
        }

        $video->update($data);

        return response()->json([
            'status'  => true,
            'message' => 'Training video updated successfully',
            'data'    => $video,
        ]);
    }

    /**
     * Delete a training video
     */
    public function destroy($id): JsonResponse
    {
        $video = TrainingVideo::find($id);

        if (!$video) {
            return response()->json([
                'status'  => false,
                'message' => 'Training video not found',
            ], 404);
        }

        // Delete file from storage if exists
        if ($video->video_file) {
            Storage::disk('public')->delete('videos/' . $video->video_file);
        }

        $video->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Training video deleted successfully',
        ]);
    }
}
