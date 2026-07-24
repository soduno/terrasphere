<?php

declare(strict_types=1);

namespace TerraSphere\Core\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use TerraSphere\Core\Models\User;

final class CreateAdminUserCommand extends Command
{
    protected $signature = 'terrasphere:admin
        {email : The administrator email address}
        {--username= : An optional username}
        {--password= : The password; omit this option to enter it securely}';

    protected $description = 'Create or update a TerraSphere administrator';

    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $username = $this->option('username');
        $password = $this->option('password');

        if (! is_string($password) || $password === '') {
            $password = $this->secret('Password');
            $confirmation = $this->secret('Confirm password');

            if ($password !== $confirmation) {
                $this->error('The password confirmation does not match.');

                return self::FAILURE;
            }
        }

        $validator = Validator::make(compact('email', 'username', 'password'), [
            'email' => ['required', 'email', 'max:320'],
            'username' => ['nullable', 'string', 'max:100'],
            'password' => ['required', 'string', Password::min(12)],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $user = User::query()->firstOrNew(['email' => $email]);
        $user->fill([
            'username' => $username ?: $user->username,
            'password' => $password,
            'status' => 'active',
        ]);
        $user->password_changed_at = now();
        $user->save();

        $this->info($user->wasRecentlyCreated
            ? 'Administrator created.'
            : 'Administrator updated.');

        return self::SUCCESS;
    }
}
