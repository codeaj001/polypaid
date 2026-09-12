import { TopNav } from '@/components/TopNav';
import { Button, EmptyState, IconHome } from '@/components/ui';

export function NotFound() {
  return (
    <>
      <TopNav />
      <div className="py-16 animate-fade-up">
        <EmptyState
          icon={<IconHome className="h-6 w-6" />}
          title="Link not found"
          description="This payment link doesn’t exist or was removed."
          action={
            <Button to="/" variant="ink" size="sm">
              Go home
            </Button>
          }
        />
      </div>
    </>
  );
}
