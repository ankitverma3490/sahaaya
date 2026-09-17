<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TrainingVideo;

class TrainingVideoSeeder extends Seeder
{
    public function run(): void
    {
        $videos = [
            [
                'title'      => 'Getting Started',
                'subtitle'   => 'How to Navigate the App',
                'video_url'  => '',
                'sort_order' => 1,
                'is_active'  => true,
            ],
            [
                'title'      => 'Attendance',
                'subtitle'   => 'How to Mark Attendance',
                'video_url'  => '',
                'sort_order' => 2,
                'is_active'  => true,
            ],
            [
                'title'      => 'Staff Attendance Accept',
                'subtitle'   => 'How to Accept Staff Attendance',
                'video_url'  => '',
                'sort_order' => 3,
                'is_active'  => true,
            ],
            [
                'title'      => 'Leave Apply',
                'subtitle'   => 'How to Apply for a Leave',
                'video_url'  => '',
                'sort_order' => 4,
                'is_active'  => true,
            ],
            [
                'title'      => 'Leave Accept',
                'subtitle'   => 'How to Accept a Leave',
                'video_url'  => '',
                'sort_order' => 5,
                'is_active'  => true,
            ],
        ];

        foreach ($videos as $video) {
            TrainingVideo::create($video);
        }
    }
}
