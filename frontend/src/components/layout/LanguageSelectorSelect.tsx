import { useLanguage } from '@/contexts/LanguageContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export const LanguageSelectorSelect = () => {
    const { language, setLanguage, availableLanguages, getLanguageName, getLanguageFlag } = useLanguage();

    return (
        <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue>
                    <div className="flex items-center gap-2">
                        <span>{getLanguageFlag(language)}</span>
                        <span>{getLanguageName(language)}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {availableLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                        <div className="flex items-center gap-2">
                            <span>{getLanguageFlag(lang)}</span>
                            <span>{getLanguageName(lang)}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
